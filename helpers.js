const generateRandomString = (length = 6) => {
  let result = '';
  let options = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
  for (let i = 0; i < length; i++) {
    result += options.charAt(Math.floor(Math.random() * options.length));
  }
  return result;
};


const getUserByEmail = (email, database) => {
  for (const userId in database) {
    const user = database[userId];
    if (user.email === email) {
      return user
    }
  }
  return null;
};


module.exports = {
  getUserByEmail,
  generateRandomString,
};