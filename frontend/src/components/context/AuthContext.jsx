import { createContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [loggedin, setLoggedin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return setLoggedin(false);

    try {
      const decoded = jwtDecode(token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) throw new Error("Expired");
      setUser(decoded);
      setLoggedin(true);
    } catch {
      setLoggedin(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ loggedin, setLoggedin, user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function Test() {
  return (
    <div>
      Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsam vel
      reiciendis officiis libero soluta amet recusandae dignissimos consequuntur
      ea placeat tempore aliquam officia ab, aperiam qui, repellendus voluptatum
      dolorum molestias? Maiores, aliquid sequi aut recusandae excepturi
      exercitationem voluptas deleniti officiis consequatur dolores vitae,
      voluptates obcaecati ullam aliquam consequuntur tempora corrupti ducimus
      rerum eius. Ea aliquid eos quasi, iste aut odio! Aut incidunt odit
      corporis voluptate nesciunt ab repellat atque consequatur doloremque.
      Consequuntur facere id cupiditate ad fugiat, quae, deserunt consequatur
      recusandae, distinctio velit quas asperiores? Aliquid nemo incidunt
      possimus delectus. Perspiciatis accusantium velit reprehenderit deleniti,
      vitae provident deserunt molestias eaque ut sequi necessitatibus
      voluptatibus. Aliquid totam laboriosam aut maiores mollitia, quis saepe
      voluptates dicta! Incidunt voluptates iure deleniti error tenetur? Velit
      maxime veritatis dicta impedit totam sed. Inventore dolores porro alias
      error a, dicta qui est suscipit aut, cum reprehenderit unde libero, iure
      eveniet quibusdam ab reiciendis eum ducimus natus.
    </div>
  );
}
