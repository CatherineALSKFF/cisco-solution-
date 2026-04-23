import io
from pathlib import Path
from typing import Optional

import pdfplumber


class PDFProcessor:
    """Extract text from PDF files, with OCR fallback for scanned documents."""

    def __init__(self, ocr_enabled: bool = True):
        self.ocr_enabled = ocr_enabled

    def extract_text(self, file_path: str | Path) -> str:
        """Extract text from a PDF file."""
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"PDF not found: {path}")

        text = self._extract_with_pdfplumber(path)

        if not text.strip() and self.ocr_enabled:
            text = self._extract_with_ocr(path)

        return text

    def extract_text_from_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes (for API uploads)."""
        text = self._extract_with_pdfplumber_bytes(pdf_bytes)

        if not text.strip() and self.ocr_enabled:
            text = self._extract_with_ocr_bytes(pdf_bytes)

        return text

    def _extract_with_pdfplumber(self, path: Path) -> str:
        """Extract text using pdfplumber (works for digitally-generated PDFs)."""
        pages_text = []
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)
        return "\n\n".join(pages_text)

    def _extract_with_pdfplumber_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes using pdfplumber."""
        pages_text = []
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text() or ""
                pages_text.append(text)
        return "\n\n".join(pages_text)

    def _extract_with_ocr(self, path: Path) -> str:
        """Extract text using OCR (for scanned PDFs)."""
        try:
            from pdf2image import convert_from_path
            import pytesseract
        except ImportError:
            return ""

        pages_text = []
        images = convert_from_path(path)
        for image in images:
            text = pytesseract.image_to_string(image)
            pages_text.append(text)
        return "\n\n".join(pages_text)

    def _extract_with_ocr_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes using OCR."""
        try:
            from pdf2image import convert_from_bytes
            import pytesseract
        except ImportError:
            return ""

        pages_text = []
        images = convert_from_bytes(pdf_bytes)
        for image in images:
            text = pytesseract.image_to_string(image)
            pages_text.append(text)
        return "\n\n".join(pages_text)

    def get_metadata(self, file_path: str | Path) -> dict:
        """Extract PDF metadata."""
        path = Path(file_path)
        with pdfplumber.open(path) as pdf:
            return {
                "page_count": len(pdf.pages),
                "metadata": pdf.metadata or {},
            }
