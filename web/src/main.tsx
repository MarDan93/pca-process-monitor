import { createRoot } from 'react-dom/client';
import { SessionGate } from './workspace/SessionGate';
import './styles.css';
import './system/system.css';
createRoot(document.getElementById('root')!).render(<SessionGate/>);
