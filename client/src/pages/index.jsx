import React from "react";
import Main from "@/components/Main";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

function index() {
  return (
    <ProtectedRoute>
      <Main />
    </ProtectedRoute>
  );
}

export default index;
