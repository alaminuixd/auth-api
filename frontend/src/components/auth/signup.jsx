import style from "./signup.module.css";
export default function Signup() {
  return (
    <div className={style["signup-wrapper"]}>
      <form>
        <div>
          <label htmlFor="email">Email: </label>
          <input type="email" name="email" />
        </div>
        <div>
          <label htmlFor="password">Password: </label>
          <input type="password" name="password" />
        </div>
        <div>
          <button type="submit">Signup</button>
        </div>
      </form>
    </div>
  );
}
