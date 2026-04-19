import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 8px;
  color: #333;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 32px;
`;

const LogoutButton = styled.button`
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 600;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: #5a6fd6;
  }
`;

export default function Dashboard() {
  const { name, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <Container>
      <Card>
        <Title>Welcome, {name}!</Title>
        <Subtitle>Your Presto dashboard</Subtitle>
        <LogoutButton onClick={handleLogout}>Log Out</LogoutButton>
      </Card>
    </Container>
  );
}
