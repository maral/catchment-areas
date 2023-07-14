import React from 'react';
import { useSession } from 'next-auth/react';

function withAuthentication<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function WithAuthenticationComponent(props: P) {
    const session = useSession();
    
    if (session.status === 'loading') {
      return <p>Waiting for session...</p>;
    }

    if (session.status === 'authenticated') {
      return <WrappedComponent {...props} />;
    }

    // Optional: You can also return something else for non-authenticated users
    return <p>User not authenticated.</p>;
  };
}


export default withAuthentication;