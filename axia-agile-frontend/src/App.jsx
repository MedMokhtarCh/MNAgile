import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import AppRoutes from './routes/AppRoutes';
import './styles/global.css';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;