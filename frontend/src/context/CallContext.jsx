/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";
import useWebRTC from "../hooks/useWebRTC";
import CallModal from "../components/CallModal";

const CallContext = createContext(null);

export const useCall = () => {
  const context = useContext(CallContext);
  return context || {};
};

export const CallProvider = ({ children }) => {
  const webrtc = useWebRTC();

  // Determine active contact name and picture based on who initiated the call
  const activeContact = webrtc.isCaller ? webrtc.targetProfile : webrtc.callerProfile;
  const displayName = activeContact?.name || "User";
  const avatarSrc = activeContact?.pic || "";

  return (
    <CallContext.Provider value={webrtc}>
      {children}
      {/* Global CallModal ensures incoming and active calls render across all views */}
      {webrtc.callState !== "idle" && (
        <CallModal
          webrtc={webrtc}
          name={displayName}
          avatarSrc={avatarSrc}
        />
      )}
    </CallContext.Provider>
  );
};

export default CallContext;
