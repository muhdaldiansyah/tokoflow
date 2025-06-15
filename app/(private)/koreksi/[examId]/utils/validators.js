// app/dashboard/autograde/[examId]/utils/validators.js

/**
 * Essential validation utilities
 */

/**
 * Validate grade input (0-100)
 */
export function validateGradeInput(value) {
  const errors = [];
  
  if (!value && value !== 0) {
    errors.push("Nilai tidak boleh kosong");
    return errors;
  }
  
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    errors.push("Nilai harus berupa angka");
    return errors;
  }
  
  if (numericValue < 0) {
    errors.push("Nilai tidak boleh kurang dari 0");
  }
  
  if (numericValue > 100) {
    errors.push("Nilai tidak boleh lebih dari 100");
  }
  
  return errors;
}

/**
 * Validate student name
 */
export function validateStudentName(name) {
  const errors = [];
  
  if (!name || !name.trim()) {
    errors.push("Nama siswa tidak boleh kosong");
    return errors;
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    errors.push("Nama siswa minimal 2 karakter");
  }
  
  return errors;
}

/**
 * Validate class name
 */
export function validateClassName(className) {
  const errors = [];
  
  if (!className) return errors; // Class name is optional
  
  const trimmedClassName = className.trim();
  
  if (trimmedClassName.length > 50) {
    errors.push("Nama kelas maksimal 50 karakter");
  }
  
  return errors;
}

/**
 * Validate exam title
 */
export function validateExamTitle(title) {
  const errors = [];
  
  if (!title || !title.trim()) {
    errors.push("Judul tugas tidak boleh kosong");
    return errors;
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < 3) {
    errors.push("Judul tugas minimal 3 karakter");
  }
  
  return errors;
}

/**
 * Validate file size
 */
export function validateFileSize(file, maxSizeMB = 10) {
  const errors = [];
  
  if (!file) {
    errors.push("File tidak ditemukan");
    return errors;
  }
  
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB > maxSizeMB) {
    errors.push(`Ukuran file maksimal ${maxSizeMB} MB`);
  }
  
  return errors;
}

/**
 * Validate file type
 */
export function validateFileType(file, allowedTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"]) {
  const errors = [];
  
  if (!file) {
    errors.push("File tidak ditemukan");
    return errors;
  }
  
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes.map(type => {
      switch (type) {
        case "image/jpeg": return "JPG";
        case "image/png": return "PNG";
        case "image/gif": return "GIF";
        case "application/pdf": return "PDF";
        default: return type.split("/")[1]?.toUpperCase() || type;
      }
    });
    
    errors.push(`Format file harus: ${allowedExtensions.join(", ")}`);
  }
  
  return errors;
}

// Export essential validators
export default {
  validateGradeInput,
  validateStudentName,
  validateClassName,
  validateExamTitle,
  validateFileSize,
  validateFileType,
};
