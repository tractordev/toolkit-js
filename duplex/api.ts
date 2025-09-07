
export interface Session {
  open(): Promise<Channel>;
  accept(): Promise<Channel | null>;
  close(): Promise<void>;
}

export interface Channel {
  session: Session;

  read(p: Uint8Array): Promise<number | null>;
  write(p: Uint8Array): Promise<number>;
  close(): Promise<void>;
  closeWrite(): Promise<void>;
}