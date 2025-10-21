/* 
Following code shows how "result.password = undefined;" in controller function "signup" works
 */
const fake = [];
class User {
  constructor({ name, email, password }) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
  async save() {
    fake.push({ name: this.name, email: this.email, password: this.password });
    return { name: this.name, email: this.email, password: this.password };
  }
}

const newUser = new User({
  name: "Al Amin",
  email: "al@gmail.com",
  password: "Kh@n",
});

const result = await newUser.save();

result.password = undefined;

console.log(result); // {name: 'Al Amin', email: 'al@gmail.com', password: undefined}
console.log(newUser); // User {name: 'Al Amin', email: 'al@gmail.com', password: 'Kh@n'}
