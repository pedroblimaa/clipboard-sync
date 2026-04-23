import './App.css'
import { MainPanel } from '../components/MainPanel/MainPanel'
import { Footer } from '../components/Footer/Footer'

export function App() {
  return (
    <main className='app-shell'>
      <MainPanel />
      <Footer />
    </main>
  )
}
