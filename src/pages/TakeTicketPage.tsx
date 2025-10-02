/**
 * Take Ticket Page - Redirects to new ClientQueue page
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TakeTicketPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/client-queue', { replace: true });
  }, [navigate]);

  return null;
}
