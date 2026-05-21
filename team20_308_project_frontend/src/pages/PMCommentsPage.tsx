// src/pages/PMCommentsPage.tsx

import React from "react";
import PendingCommentsTable from "../components/PendingCommentsTable";
import "../styles/pmPage.css";

const PMCommentsPage: React.FC = () => (
  <div className="pm-wrapper">
    <h1>Pending Comments</h1>
    <section className="pm-section">
      <PendingCommentsTable />
    </section>
  </div>
);

export default PMCommentsPage;
