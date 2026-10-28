"use client";

import { createContext, useContext } from "react";

/** Editor-only presentation, without fake bank data or changes to public invitations. */
export const InvitationEditingContext = createContext(false);
export const useInvitationEditing = () => useContext(InvitationEditingContext);
