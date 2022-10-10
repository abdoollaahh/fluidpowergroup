export interface ICart {
  open: boolean;
  items: IItemCart[];
}

export interface IItemCart {
  id: string,
  name: string,
  price: number,
  stock: number,
  id_inch: string,
  id_mm: string,
  od_mm: string,
  working_pressure_mpa: string,
  working_pressure_psi: string,
  burst_pressure_mpa: string,
  burst_pressure_psi: string,
  min_bend_radius_mm: string,
  quantity: number
}
