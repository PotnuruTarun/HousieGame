export const generateTicket = () => {
  const ticket = Array.from({ length: 3 }, () => Array(9).fill(null));
  const columnRanges = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49], 
    [50, 59], [60, 69], [70, 79], [80, 90]
  ];

  // 1. Ensure each column has at least one number
  const colIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  
  // Randomly assign one number to each column in a random row
  colIndices.forEach(col => {
    const row = Math.floor(Math.random() * 3);
    const [min, max] = columnRanges[col];
    ticket[row][col] = Math.floor(Math.random() * (max - min + 1)) + min;
  });

  // 2. Add remaining numbers (6 more to make it 15 total, 5 per row)
  // Current count: 9. Need 6 more.
  let currentTotal = 9;
  while (currentTotal < 15) {
    const row = Math.floor(Math.random() * 3);
    const col = Math.floor(Math.random() * 9);
    
    // Check if row already has 5 numbers
    const rowCount = ticket[row].filter(n => n !== null).length;
    if (rowCount < 5 && ticket[row][col] === null) {
      const [min, max] = columnRanges[col];
      let num;
      // Ensure no duplicate in column
      do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (ticket.some(r => r[col] === num));
      
      ticket[row][col] = num;
      currentTotal++;
    }
  }

  // 3. Sort columns
  for (let col = 0; col < 9; col++) {
    const colNums = [];
    const rowIndices = [];
    for (let row = 0; row < 3; row++) {
      if (ticket[row][col] !== null) {
        colNums.push(ticket[row][col]);
        rowIndices.push(row);
      }
    }
    colNums.sort((a, b) => a - b);
    rowIndices.forEach((rowIndex, i) => {
      ticket[rowIndex][col] = colNums[i];
    });
  }

  return ticket;
};
