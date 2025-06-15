// app/dashboard/autograde/[examId]/utils/formatters.js

const formatters = {
  formatClassName: (className) => {
    if (!className) return 'Kelas tidak disebutkan';
    return `Kelas ${className}`;
  },

  formatExamDate: (date) => {
    if (!date) return 'Tanggal tidak disebutkan';
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
  },

  formatDateTime: (dateString) => {
    if (!dateString) return 'Tanggal tidak tersedia';
    const options = { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  },

  formatGradeWithColor: (grade) => {
    if (grade === null || grade === undefined) return null;
    const score = Number(grade);
    if (score >= 80) return { color: 'text-green-600 dark:text-green-400', label: `${score}%` };
    if (score >= 60) return { color: 'text-yellow-600 dark:text-yellow-400', label: `${score}%` };
    return { color: 'text-red-600 dark:text-red-400', label: `${score}%` };
  }
};

export default formatters;
