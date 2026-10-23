COLAB — JUST DO THIS
====================

Everything is already in this folder. No bat file needed.

1. Go to colab.research.google.com
2. Runtime → Change runtime type → T4 GPU
3. File → Upload notebook → Run_Training.ipynb
4. Runtime → Run all
5. When file picker appears → select Waste_YOLO_Colab_Ready.zip (same folder)
6. Wait ~1-3 hours. Two .pt files download at the end.

Copy to your project:
  garbage_best.pt → ml_service/models/garbage_best.pt
  plastic_best.pt → ml_service/models/plastic_best.pt

Run ml_service\start.bat → Live Camera works.
