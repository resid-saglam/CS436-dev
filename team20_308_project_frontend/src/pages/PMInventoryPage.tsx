// src/pages/PMInventoryPage.tsx
import InventoryTable from "../components/InventoryTable";
import "../styles/pmPage.css";      // aynı stil dosyasını kullanalım

const PMInventoryPage = () => (
    <div className="pm-wrapper">
        <h1>Inventory</h1>
        <section className="pm-section">
            <InventoryTable />
        </section>
    </div>
);

export default PMInventoryPage;
