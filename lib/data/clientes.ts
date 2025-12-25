export interface Cliente {
  id: string
  nombre: string
  apellido: string
  razonSocial?: string
  cuit?: string
  dni?: string
  email?: string
  telefono?: string
  direccion?: string
  ciudad?: string
  provincia?: string
  codigoPostal?: string
  condicionIva: "Consumidor Final" | "Responsable Inscripto" | "Monotributista" | "Exento"
  tipo: "particular" | "empresa"
}

export const CLIENTES: Cliente[] = [
  {
    id: "CLI-001",
    nombre: "Juan",
    apellido: "Pérez",
    dni: "32456789",
    email: "juan.perez@email.com",
    telefono: "+54 11 4567-8901",
    direccion: "Av. Corrientes 1234",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1043",
    condicionIva: "Consumidor Final",
    tipo: "particular",
  },
  {
    id: "CLI-002",
    nombre: "María",
    apellido: "González",
    dni: "28765432",
    email: "maria.gonzalez@email.com",
    telefono: "+54 11 5678-9012",
    direccion: "Calle Florida 567",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1005",
    condicionIva: "Monotributista",
    tipo: "particular",
  },
  {
    id: "CLI-003",
    nombre: "Carlos",
    apellido: "Rodríguez",
    razonSocial: "Distribuidora Norte S.A.",
    cuit: "30-71234567-8",
    email: "compras@distribuidoranorte.com",
    telefono: "+54 11 6789-0123",
    direccion: "Av. Libertador 4567",
    ciudad: "Vicente López",
    provincia: "Buenos Aires",
    codigoPostal: "1638",
    condicionIva: "Responsable Inscripto",
    tipo: "empresa",
  },
  {
    id: "CLI-004",
    nombre: "Ana",
    apellido: "Martínez",
    razonSocial: "Vinoteca El Sabor SRL",
    cuit: "30-65432198-7",
    email: "pedidos@vinotecaelsabor.com",
    telefono: "+54 11 7890-1234",
    direccion: "Av. Santa Fe 2345",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1123",
    condicionIva: "Responsable Inscripto",
    tipo: "empresa",
  },
  {
    id: "CLI-005",
    nombre: "Roberto",
    apellido: "Fernández",
    dni: "35678901",
    email: "roberto.f@email.com",
    telefono: "+54 11 8901-2345",
    direccion: "Calle Tucumán 890",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1049",
    condicionIva: "Consumidor Final",
    tipo: "particular",
  },
  {
    id: "CLI-006",
    nombre: "Laura",
    apellido: "Sánchez",
    razonSocial: "Restaurant La Esquina",
    cuit: "20-29876543-2",
    email: "laura@restaurantlaesquina.com",
    telefono: "+54 11 9012-3456",
    direccion: "Av. Callao 1567",
    ciudad: "Buenos Aires",
    provincia: "CABA",
    codigoPostal: "1022",
    condicionIva: "Responsable Inscripto",
    tipo: "empresa",
  },
]
