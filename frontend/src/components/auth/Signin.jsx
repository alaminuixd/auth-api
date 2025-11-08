import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import style from "./Signin.module.css";
export default function Signin() {
  const { setLoggedin } = useContext(AuthContext); // 👈 get it here
  const [formDataState, setFormDataState] = useState({
    email: "",
    password: "",
  });
  const [result, setResult] = useState({
    error: null,
    success: null,
  });
  // handler functions
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormDataState((prev) => {
      return {
        ...prev,
        [name]: value,
      };
    });
  };
  // submit form handler function
  const handleInputSubmit = async (e) => {
    e.preventDefault();
    setResult({ error: null, success: null });
    const isEmpty = Object.values(formDataState).some((value) => !value.trim());
    if (isEmpty) {
      setResult({ error: "All fields are required!", success: null });
    }
    const formData = new FormData();
    Object.entries(formDataState).forEach(([key, val]) => {
      formData.append(key, val);
    });
    try {
      const res = await fetch("http://localhost:3009/api/auth/signin", {
        method: "POST",
        body: formData,
        credentials: "include", //👈 VERY IMPORTANT
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.message || "Login Success");
      }
      console.log(resData);
      // save in local storage
      localStorage.setItem("accessToken", resData.accessToken);
      setLoggedin(true);
      // reset formDataState
      setFormDataState({ email: "", password: "" });
      setResult({ error: "", success: resData.message });
    } catch (error) {
      setResult({ error: error.message, success: "" });
    }
  };

  useEffect(() => {
    const successTimer = setTimeout(
      () => setResult((prev) => ({ ...prev, success: "" })),
      3000
    );
    return () => clearTimeout(successTimer);
  }, [result.success]);
  return (
    <div className={style["signin-wrapper"]}>
      <h1 className="text-center mb-5">Login</h1>
      <form onSubmit={handleInputSubmit}>
        <div>
          <label htmlFor="email">Email: </label>
          <input
            type="email"
            name="email"
            value={formDataState.email}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <label htmlFor="password">Password: </label>
          <input
            type="password"
            name="password"
            value={formDataState.password}
            onChange={handleInputChange}
          />
        </div>
        <div>
          <button type="submit">Signin</button>
        </div>
        <div className="text-center">
          {result && result?.success ? (
            <p className={style["success"]}>{result.success}</p>
          ) : (
            <p className={style["error"]}>{result.error}</p>
          )}
        </div>
      </form>
    </div>
  );
}
