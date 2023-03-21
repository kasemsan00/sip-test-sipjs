import { useRef } from "react";
import { Inviter, Session, SessionState, UserAgent, UserAgentOptions } from "sip.js";
import "./App.css";

const sipAccount = {
  domain: "",
  websocket: "",
  extension: "",
  password: "",
};

function App() {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const handleRegister = () => {
    const userAgentOptions: UserAgentOptions = {
      uri: UserAgent.makeURI("sip:" + sipAccount.extension + "@" + sipAccount.domain),
      authorizationPassword: sipAccount.password,
      authorizationUsername: sipAccount.extension,
      transportOptions: {
        server: sipAccount.websocket,
      },
    };

    const userAgent = new UserAgent(userAgentOptions);

    userAgent.start().then(() => {
      // Set target destination (callee)
      const target = UserAgent.makeURI("sip:" + "9999" + "@" + sipAccount.domain);
      if (!target) {
        throw new Error("Failed to create target URI.");
      }

      const inviter = new Inviter(userAgent, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: true },
        },
      });

      // Handle outgoing session state changes
      inviter.stateChange.addListener((newState) => {
        switch (newState) {
          case SessionState.Establishing:
            // Session is establishing
            break;
          case SessionState.Established:
            // Session has been established
            break;
          case SessionState.Terminated:
            // Session has terminated
            break;
          default:
            break;
        }
      });

      inviter
        .invite()
        .then(() => {
          // INVITE sent
        })
        .catch((error: Error) => {
          console.log(error);
        });
    });
  };

  const setupRemoteMedia = (session: Session) => {
    const remoteStream = new MediaStream();
    if (session.sessionDescriptionHandler !== undefined) {
      const { sessionDescriptionHandler } = session;
      sessionDescriptionHandler: SIP.Web.sessionDescriptionHandler;
      sessionDescriptionHandler.peerConnection;
      // session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver: RTCRtpReceiver) => {
      //   if (receiver.track) {
      //     remoteStream.addTrack(receiver.track);
      //   }
      // });
    }

    if (remoteVideoRef.current !== null) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  };

  return (
    <div className="App">
      <button onClick={handleRegister}>Register</button>
      <div className="local-video">
        <video ref={localVideoRef} autoPlay playsInline />
      </div>
      <div className="remote-video">
        <video ref={remoteVideoRef} autoPlay playsInline />
      </div>
    </div>
  );
}

export default App;
