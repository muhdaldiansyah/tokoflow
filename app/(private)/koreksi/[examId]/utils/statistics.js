// app/dashboard/autograde/[examId]/utils/statistics.js

export const calculateStats = (studentSubmissions = [], correctAnswerFiles = []) => {
  const totalStudents = studentSubmissions.length;
  const totalAnswerKeys = correctAnswerFiles.length;
  
  let totalFilesUploaded = 0;
  let totalUploaded = 0;
  let totalGraded = 0;
  let totalPending = 0;
  let gradedScores = [];
  
  studentSubmissions.forEach(submission => {
    if (submission.files && submission.files.length > 0) {
      totalFilesUploaded += submission.files.length;
      totalUploaded++;
      
      if (submission.grade !== null) {
        totalGraded++;
        gradedScores.push(submission.grade);
      } else {
        totalPending++;
      }
    }
  });
  
  const averageScore = gradedScores.length > 0
    ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
    : null;
    
  return {
    totalStudents,
    totalAnswerKeys,
    totalFilesUploaded,
    totalUploaded,
    totalGraded,
    totalPending,
    averageScore
  };
};

export const getStudentStatusColor = (submission) => {
  if (!submission.files || submission.files.length === 0) {
    return {
      color: 'text-gray-400 dark:text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-700/30',
      icon: '⚪'
    };
  }
  
  if (submission.grade !== null) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: '🟢'
    };
  }
  
  if (submission.statusError || submission.filesError) {
    return {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: '🔴'
    };
  }
  
  return {
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: '🟡'
  };
};

export const filterStudentsByStatus = (studentSubmissions = [], filter) => {
  switch (filter) {
    case 'all':
      return studentSubmissions;
    case 'uploaded':
      return studentSubmissions.filter(s => s.files && s.files.length > 0);
    case 'graded':
      return studentSubmissions.filter(s => s.grade !== null);
    case 'pending':
      return studentSubmissions.filter(s => s.files && s.files.length > 0 && s.grade === null);
    case 'notUploaded':
      return studentSubmissions.filter(s => !s.files || s.files.length === 0);
    default:
      return studentSubmissions;
  }
};
