import { Link } from 'react-router-dom';
import styled from 'styled-components';

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  padding: 20px;
`;

const Logo = styled.h1`
  font-size: 64px;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 20px;
  opacity: 0.9;
  margin-bottom: 48px;
`;

const Buttons = styled.div`
  display: flex;
  gap: 16px;
`;

const PrimaryButton = styled(Link)`
  padding: 14px 32px;
  font-size: 18px;
  font-weight: 600;
  border-radius: 8px;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
`;

const LoginBtn = styled(PrimaryButton)`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const RegisterBtn = styled(PrimaryButton)`
  background: white;
  color: #764ba2;

  &:hover {
    background: #f0f0f0;
  }
`;

export default function Landing() {
  return (
    <Container>
      <Logo>🪄</Logo>
      <Title>Presto</Title>
      <Subtitle>Revolutionise your presentations</Subtitle>
      <Buttons>
        <LoginBtn to="/login">Log In</LoginBtn>
        <RegisterBtn to="/register">Register</RegisterBtn>
      </Buttons>
    </Container>
  );
}
