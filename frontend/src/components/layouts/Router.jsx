import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./RootLayout";
import About from "./../pages/About";
import Services from "./../pages/Services";
import Blogs from "./../pages/Blogs";
import Home from "../pages/Home";
import Signin from "./../auth/Signin";
import Signup from "../auth/signup";
const Router = () => {
  const routers = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Home /> },
        { path: "/about", element: <About /> },
        { path: "/services", element: <Services /> },
        { path: "/blogs", element: <Blogs /> },
        { path: "/signin", element: <Signin /> },
        { path: "/signup", element: <Signup /> },
      ],
    },
  ]);
  return <RouterProvider router={routers} />;
};

export default Router;
/* 
--src
  --components
    --auth
    Signin.jsx
    --layouts
      RootLayout.jsx
      Router.jsx
    --pages
      --About.jsx
      --Blogs.jsx
      --Home.jsx
      --Services.jsx
    --context
      AuthContext.jsx
  App.jsx
  main.jsx
*/
