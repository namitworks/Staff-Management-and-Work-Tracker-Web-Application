import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

/**
 * Downloads a DOM element as a PNG image.
 * @param {React.RefObject} elementRef - Reference to the element to capture.
 * @param {string} filename - The name of the file to save.
 */
export const downloadAsPNG = async (elementRef, filename) => {
  if (!elementRef.current) return;

  try {
    const dataUrl = await toPng(elementRef.current, { cacheBust: true, pixelRatio: 2 });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Error generating PNG:', err);
    throw err;
  }
};

/**
 * Downloads a DOM element as a PDF document.
 * @param {React.RefObject} elementRef - Reference to the element to capture.
 * @param {string} filename - The name of the file to save.
 */
export const downloadAsPDF = async (elementRef, filename) => {
  if (!elementRef.current) return;

  try {
    const dataUrl = await toPng(elementRef.current, { cacheBust: true, pixelRatio: 2 });
    
    // Create PDF (A4 size: 210mm x 297mm)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Get element dimensions to calculate aspect ratio
    const { width, height } = elementRef.current.getBoundingClientRect();
    const ratio = width / height;

    // Calculate image dimensions to fit centered on A4
    // Target height is about 70% of A4 height to look good
    const imgHeight = 180; 
    const imgWidth = imgHeight * ratio;

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(dataUrl, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  }
};
