const fs = require('fs');

const filePath = process.argv[2];

fs.readFile(filePath, 'utf-8', (err, content) => {
  if (err) {
    throw err;
  } else {
    content = content.replace(/process\.env([^ ,]+)/g, match => {
      const value = eval(match);
      value === undefined ? console.log('Replacing', match) : console.warn('Replacing', match, 'with undefined, as no matching env variable was found');
      // TODO: this only works with string env variables
      return value === undefined ? undefined : `'${value}'`;
    })
    fs.writeFile(filePath, content, (err) => {
      if (err) {
        throw err;
      } else {
        console.log(
          `Angular environment file updated at ${filePath} \n`,
        );
      }
    });
  }
})

