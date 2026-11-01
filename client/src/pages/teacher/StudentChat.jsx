import React, { useEffect, useState } from 'react';
import connectionService from '../../services/connectionService';
import ChatInbox from '../../components/chat/ChatInbox';

export default function StudentChat() {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    connectionService
      .getConnections()
      .then((connections) => setContacts(connections.map((c) => ({ id: c.student._id, name: c.student.name, email: c.student.email }))))
      .catch(() => setContacts([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <span className="eyebrow">Student Chat</span>
      <h2>Message your students</h2>
      <ChatInbox contacts={contacts} isLoadingContacts={isLoading} contactLabel="student" />
    </div>
  );
}
