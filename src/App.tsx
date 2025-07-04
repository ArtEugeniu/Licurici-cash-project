import DashboardLayout from "./components/dashboardLayout/DashboardLayout";
import './assets/styles/global.scss';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import { useState } from "react";;

function App() {

  const [activeTab, setActiveTab] = useState<string>('program');

  return (
    <>
      < DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab} />
    </>
  )
}

export default App;
