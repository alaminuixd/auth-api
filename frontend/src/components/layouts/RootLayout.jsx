import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function RootLayout() {
  const { loggedin, setLoggedin } = useContext(AuthContext);
  const [user, setUser] = useState(null);
  const handleSignout = async () => {
    try {
      localStorage.removeItem("accessToken");
      setLoggedin(false);

      const res = await fetch("http://localhost:3009/api/auth/signout", {
        method: "POST",
        credentials: "include", // 👈 important for sending refreshToken cookie
      });

      const data = await res.json();
      console.log(data.message);
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoggedin(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000; // in seconds
      if (decoded.exp < currentTime) {
        console.log("Token expired");
        localStorage.removeItem("accessToken");
        setLoggedin(false);
        return;
      }
      setUser(decoded);
      setLoggedin(true);
    } catch (error) {
      console.log("Invalid token");
      setLoggedin(false);
    }
  }, []); // ✅ run once on mount

  return (
    <div className="bg-gray-100">
      <nav className="w-full bg-gray-500 text-white py-5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1>
              <NavLink to="/">Logo</NavLink>
            </h1>
          </div>
          <ul className="top-nav-links flex space-x-6">
            <li>
              <NavLink to="/about">About</NavLink>
            </li>
            <li>
              <NavLink to="/services">Services</NavLink>
            </li>
            <li>
              <NavLink to="/blogs">Blogs</NavLink>
            </li>

            {loggedin ? (
              <>
                <li>
                  <NavLink to="/profile">Profile</NavLink>
                  <ul>
                    <li>
                      <NavLink to="#">Notification</NavLink>
                    </li>
                    <li>
                      <NavLink to="#">Settings</NavLink>
                    </li>
                    <li>
                      <NavLink onClick={handleSignout}>Logout</NavLink>
                    </li>
                  </ul>
                </li>
              </>
            ) : (
              <>
                <li>
                  <NavLink to="/signin">Login</NavLink>
                </li>
                <li>
                  <NavLink to="/signup">Signup</NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
