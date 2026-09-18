"""
Streamlit Web Application for IDRiD Retinal Lesion Segmentation (SIH26038).
"""

import os
import glob
import json
import numpy as np
import cv2
from PIL import Image
import torch
import streamlit as st
import pandas as pd
from render_client import is_configured as render_api_configured, predict as render_predict

from model import UNet
from dataset import apply_clahe, LESION_TYPES
from predict import load_prediction_model, predict_single_image, LESION_COLORS_RGB, LESION_NAMES_FULL

st.set_page_config(
    page_title="IDRiD Retinal Lesion Segmentation | SIH26038",
    page_icon="👁️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        color: #1E3A8A;
        font-weight: 700;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.1rem;
        color: #4B5563;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background-color: #F3F4F6;
        border-radius: 8px;
        padding: 12px;
        border-left: 5px solid #3B82F6;
    }
    .badge-detected {
        background-color: #FEE2E2;
        color: #991B1B;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
    }
    .badge-clean {
        background-color: #D1FAE5;
        color: #065F46;
        font-weight: bold;
        padding: 4px 8px;
        border-radius: 4px;
    }
</style>
""", unsafe_allow_html=True)


@st.cache_resource
def get_model(checkpoint_path):
    device = torch.device("cuda" if torch.cuda.is_available() else ("mps" if hasattr(torch.backends, "mps") and torch.backends.mps.is_available() else "cpu"))
    if not os.path.exists(checkpoint_path):
        return None, None, device
    try:
        model, model_args = load_prediction_model(checkpoint_path, device)
        return model, model_args, device
    except Exception as e:
        st.error(f"Error loading model: {e}")
        return None, None, device


def main():
    st.markdown("<div class='main-title'>👁️ IDRiD Retinal Lesion Segmentation System</div>", unsafe_allow_html=True)
    st.markdown("<div class='sub-title'>Smart India Hackathon 2026 (SIH26038) | PyTorch U-Net Multi-Label Segmentation</div>", unsafe_allow_html=True)

    # Sidebar controls
    st.sidebar.header("⚙️ System Configurations")
    
    checkpoint_path = st.sidebar.text_input("Model Checkpoint Path", "./checkpoints/best_model.pth")
    threshold = st.sidebar.slider("Detection Confidence Threshold", 0.1, 0.9, 0.5, 0.05)
    overlay_alpha = st.sidebar.slider("Overlay Transparency (Alpha)", 0.1, 1.0, 0.55, 0.05)
    use_clahe = st.sidebar.checkbox("Apply CLAHE Enhancement", True)

    use_render_api = render_api_configured("idrid")
    if use_render_api:
        st.sidebar.success("Connected to the IDRiD Render service")
        for model_name in ("aptos", "drive"):
            if render_api_configured(model_name):
                st.sidebar.caption(f"{model_name.upper()} Render service configured")
    else:
        st.sidebar.info("Local model mode. Add Render credentials to `.env` to use the deployed API.")

    model, model_args, device = (None, None, None) if use_render_api else get_model(checkpoint_path)

    if model is None and not use_render_api:
        st.warning(f"⚠️ Model checkpoint not found at `{checkpoint_path}`. Please train the model first using `python train.py` or generate sample data.")
        st.info("💡 You can train a quick demo model by running: `python train.py --epochs 3` in your terminal.")

    # Data Input Selection
    st.sidebar.markdown("---")
    st.sidebar.header("📥 Select Image Source")
    input_method = st.sidebar.radio("Choose Input Method", ["Upload Fundus Image", "Use Sample Dataset Image"])

    temp_image_path = None

    if input_method == "Upload Fundus Image":
        uploaded_file = st.file_uploader("Upload Retinal Fundus Image (.jpg, .png, .tif)", type=["jpg", "jpeg", "png", "tif", "tiff"])
        if uploaded_file is not None:
            os.makedirs("./temp_uploads", exist_ok=True)
            temp_image_path = os.path.join("./temp_uploads", uploaded_file.name)
            with open(temp_image_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
    else:
        sample_folder = "./data/idrid_sample/1. Original Images/a. Training Set"
        if not os.path.exists(sample_folder):
            sample_folder = "./data/idrid"

        sample_images = glob.glob(os.path.join(sample_folder, "*.jpg")) + glob.glob(os.path.join(sample_folder, "*.png"))
        if sample_images:
            selected_sample = st.sidebar.selectbox("Choose Sample Image", sample_images)
            temp_image_path = selected_sample
        else:
            st.sidebar.warning("No sample images found. Please run `python dataset.py --generate-sample` first.")

    # Main Dashboard Body
    tabs = st.tabs(["🔬 Inference & Lesion Analysis", "📊 Model Performance & Metrics", "📘 SIH Architecture & Loss Functions"])

    with tabs[0]:
        if temp_image_path and os.path.exists(temp_image_path):
            col1, col2 = st.columns([1, 1])

            # Preprocessing View
            img_bgr = cv2.imread(temp_image_path)
            orig_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
            clahe_rgb = apply_clahe(img_bgr)

            with col1:
                st.subheader("📷 Input Retinal Image")
                st.image(orig_rgb, use_container_width=True, caption=f"Original Fundus ({os.path.basename(temp_image_path)})")

            with col2:
                st.subheader("✨ CLAHE Enhanced View")
                st.image(clahe_rgb, use_container_width=True, caption="Contrast-Enhanced Green Channel (Highlights MA & EX)")

            st.markdown("---")

            if (use_render_api or model is not None) and st.button("🚀 Run Lesion Segmentation Model", type="primary", use_container_width=True):
                remote_response = None
                remote_results = {}
                remote_errors = {}
                try:
                    with st.spinner("Running retinal-image inference..."):
                        if use_render_api:
                            remote_response = render_predict(temp_image_path, "idrid")
                            remote_results["idrid"] = remote_response
                            res = {"lesion_stats": remote_response["result"]["lesions"]}
                            for model_name in ("aptos", "drive"):
                                if render_api_configured(model_name):
                                    try:
                                        remote_results[model_name] = render_predict(temp_image_path, model_name)
                                    except RuntimeError as error:
                                        remote_errors[model_name] = str(error)
                        else:
                            img_size = model_args.get("img_size", 256) if model_args else 256
                            res = predict_single_image(model, temp_image_path, device, img_size=(img_size, img_size), threshold=threshold, use_clahe=use_clahe)
                except RuntimeError as error:
                    st.error(f"Inference failed: {error}")
                    st.stop()

                st.success("✅ Segmentation Complete!")

                if remote_response:
                    aptos = remote_results.get("aptos", {}).get("result", {})
                    prediction = aptos.get("prediction")
                    if prediction:
                        st.info(f"APTOS severity: **{prediction['predicted_label']}** ({prediction['confidence']}% confidence)")
                    drive = remote_results.get("drive", {}).get("result")
                    if drive:
                        st.caption(f"DRIVE vessel area: {drive['vessel_area_percentage']}%")
                    for model_name, error in remote_errors.items():
                        st.caption(f"{model_name.upper()}: {error}")

                # Results Layout
                res_col1, res_col2 = st.columns([1.2, 1])

                with res_col1:
                    st.subheader("🎯 Color-Coded Multi-Lesion Segmentation Overlay")
                    if use_render_api:
                        st.image(orig_rgb, use_container_width=True, caption="The deployed API returns lesion metrics; overlay export is available in local mode.")
                    else:
                        st.image(res["overlay_orig"], use_container_width=True)

                    st.markdown("""
                    **Color Legend:**
                    - <span style='color:red; font-weight:bold;'>🔴 Microaneurysms (MA)</span>: Small red dots
                    - <span style='color:#C80064; font-weight:bold;'>🟣 Hemorrhages (HE)</span>: Deep red/magenta patches
                    - <span style='color:#EAB308; font-weight:bold;'>🟡 Hard Exudates (EX)</span>: Bright yellow waxy deposits
                    - <span style='color:#06B6D4; font-weight:bold;'>🔵 Soft Exudates (SE)</span>: Pale cotton wool spots
                    """, unsafe_allow_html=True)

                with res_col2:
                    st.subheader("📈 Quantitative Lesion Breakdown")
                    
                    rows = []
                    any_detected = False
                    total_lesion_pct = 0.0

                    for code, stats in res["lesion_stats"].items():
                        status_badge = "<span class='badge-detected'>DETECTED</span>" if stats["detected"] else "<span class='badge-clean'>CLEAN</span>"
                        rows.append({
                            "Lesion Type": stats["name"],
                            "Status": status_badge,
                            "Pixel Count": f"{stats['pixel_count']:,}",
                            "Area (% Retina)": f"{stats['area_percentage']:.2f}%"
                        })
                        if stats["detected"]:
                            any_detected = True
                            total_lesion_pct += stats["area_percentage"]

                    df_stats = pd.DataFrame(rows)
                    st.write(df_stats.to_html(escape=False, index=False), unsafe_allow_html=True)

                    st.markdown("<br>", unsafe_allow_html=True)
                    st.subheader("🩺 Diagnostic Clinical Summary")
                    
                    if total_lesion_pct > 1.5 or (res["lesion_stats"]["HE"]["detected"] and res["lesion_stats"]["SE"]["detected"]):
                        st.error("⚠️ **High DR Risk / Severe Retinopathy Detected**: Significant presence of hemorrhages/exudates. Immediate ophthalmologist evaluation recommended.")
                    elif any_detected:
                        st.warning("⚡ **Mild-to-Moderate Diabetic Retinopathy Detected**: Microaneurysms / early exudates present. Regular monitoring advised.")
                    else:
                        st.success("💚 **No Diabetic Retinopathy Lesions Detected**: Retina background is within normal parameters.")

                # Class Specific Masks
                if not use_render_api:
                    st.markdown("---")
                    st.subheader("🔍 Individual Lesion Mask Inspection")
                    mask_cols = st.columns(4)

                    for idx, code in enumerate(LESION_TYPES):
                        with mask_cols[idx]:
                            m_binary = res["binary_masks_orig"][idx] * 255
                            st.image(m_binary, use_container_width=True, caption=LESION_NAMES_FULL[code])
                            st.caption(f"Pixels: {res['lesion_stats'][code]['pixel_count']}")

        else:
            st.info("👆 Please upload a fundus image or select a sample image from the left sidebar to get started.")

    with tabs[1]:
        st.subheader("📊 Validation Performance & Loss Tracking")
        
        history_path = "./checkpoints/history.json"
        if os.path.exists(history_path):
            with open(history_path, "r") as f:
                history = json.load(f)

            epochs = history.get("epochs", [])
            train_loss = history.get("train_loss", [])
            val_loss = history.get("val_loss", [])

            col_a, col_b = st.columns(2)
            with col_a:
                st.markdown("### Loss Convergence Curve")
                df_loss = pd.DataFrame({"Epoch": epochs, "Train Loss": train_loss, "Val Loss": val_loss}).set_index("Epoch")
                st.line_chart(df_loss)

            with col_b:
                st.markdown("### Best Model Metrics per Lesion Class")
                best_ckpt_path = "./checkpoints/best_model.pth"
                if os.path.exists(best_ckpt_path):
                    best_ckpt = torch.load(best_ckpt_path, map_location="cpu")
                    metrics = best_ckpt.get("metrics", {})
                    
                    m_rows = []
                    for k, v in metrics.items():
                        m_rows.append({
                            "Class": v["name"],
                            "Dice Score (F1)": f"{v['dice']:.4f}",
                            "IoU (Jaccard)": f"{v['iou']:.4f}",
                            "Precision": f"{v['precision']:.4f}",
                            "Recall": f"{v['recall']:.4f}"
                        })
                    st.table(pd.DataFrame(m_rows))
        else:
            st.info("No training history file (`history.json`) found yet. Run `python train.py` to populate performance tracking.")

    with tabs[2]:
        st.subheader("📘 System Architecture & Methodology (SIH26038)")
        st.markdown(r"""
        ### Key Technical Components:
        1. **Dataset Handling & Auto-Matching**:
           - Scans standard IDRiD folder layout (`Original Images/` and `Groundtruths/`).
           - Matches image IDs (`IDRiD_XX`) with class-specific binary mask TIFF files for `MA`, `HE`, `EX`, and `SE`.
           - Generates zero-masks automatically if a specific lesion class is absent for an image.

        2. **Preprocessing**:
           - CLAHE (Contrast Limited Adaptive Histogram Equalization) applied to the Green channel to maximize lesion contrast against fundus background.
           - ImageNet RGB standard normalization: mean `[0.485, 0.456, 0.406]`, std `[0.229, 0.224, 0.225]`.

        3. **PyTorch U-Net Architecture**:
           - Contracting Encoder path with 4 Downscaling stages (Conv -> BatchNorm -> ReLU -> MaxPool).
           - Expanding Decoder path with 4 Upscaling stages (Bilinear Interpolation / ConvTranspose -> Concat Skip Connections -> DoubleConv).
           - Output Layer: 4 channels with sigmoid activations for multi-label binary segmentation.

        4. **Loss Function for Extreme Class Imbalance**:
           - Combined BCEWithLogitsLoss and Multilabel Dice Loss:
             $$L_{total} = L_{BCE} + L_{Dice}$$
             $$L_{Dice} = 1 - \\frac{2 \sum (p_i \cdot t_i) + \epsilon}{\sum p_i^2 + \sum t_i^2 + \epsilon}$$

        5. **Strict Metrics Evaluation**:
           - Dice Score (F1), IoU (Jaccard Index), Precision (PPV), Recall (Sensitivity) evaluated per lesion class.
        """)

if __name__ == "__main__":
    main()
