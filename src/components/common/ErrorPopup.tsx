import * as Dialog from '@radix-ui/react-dialog';
import styled from 'styled-components';

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Content = styled.div`
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 90%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  font-family: system-ui, sans-serif;
`;

const Title = styled.div`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 12px;
  color: #d32f2f;
`;

const Message = styled.div`
  font-size: 14px;
  color: #333;
  margin-bottom: 20px;
  line-height: 1.5;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 4px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: #f0f0f0;
  }
`;

interface ErrorPopupProps {
  isOpen: boolean;
  onOpenChange: (_open: boolean) => void;
  message: string;
  title?: string;
}

export default function ErrorPopup(props: ErrorPopupProps) {
  return (
    <Dialog.Root open={props.isOpen} onOpenChange={props.onOpenChange}>
      <Dialog.Portal>
        <Overlay>
          <Content role="dialog" aria-modal="true" aria-labelledby="error-title">
            <CloseButton onClick={() => props.onOpenChange(false)} aria-label="Close">×</CloseButton>
            <Title id="error-title">{props.title ?? 'Error'}</Title>
            <Message>{props.message}</Message>
          </Content>
        </Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
