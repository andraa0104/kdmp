export interface Dusun {
  id: number;
  nama: string;
  created_at: Date;
  updated_at: Date;
}

export interface RT {
  id: number;
  dusun_id: number;
  nomor: string;
  created_at: Date;
  updated_at: Date;
}

export interface DusunWithRT extends Dusun {
  rtList: RT[];
}
