// User & Profile Types
export interface UserProfile {
  especialidades?: string;
  bio?: string;
  foto_perfil?: string | File;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  perfil?: UserProfile;
  is_staff?: boolean;
  is_active?: boolean;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

// Project Types
export type ProjectVisibility = 'publico' | 'privado';
export type ProjectStatus = 'activo' | 'finalizado';

export interface Project {
  id: number;
  nombre: string;
  descripcion: string;
  visibilidad: ProjectVisibility;
  estado: ProjectStatus;
  repositorio_url?: string;
  fecha_creacion: string;
  creador: User;
  miembros_count: number;
  progreso: number;
}

export type ProjectRole = 'dueño' | 'colaborador';

export interface ProjectMember {
  id: number;
  usuario: number;
  usuario_detalle: User;
  rol_proyecto: ProjectRole;
  fecha_union: string;
}

export interface Invitation {
  id: number;
  proyecto: number;
  proyecto_detalle: Project;
  usuario_invitado: number;
  usuario_invitado_detalle: User;
  usuario_remitente: number;
  usuario_remitente_detalle: User;
  rol_invitado: ProjectRole;
  estado: 'pendiente' | 'aceptada' | 'rechazada';
  fecha_creacion: string;
  fecha_respuesta?: string | null;
}

// Sprint Types
export type SprintStatus = 'planeado' | 'activo' | 'terminado';

export interface Sprint {
  id: number;
  nombre: string;
  objetivo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: SprintStatus;
  proyecto: number;
  proyecto_detalle?: Project;
  color: string;
}

// Epic & Story Types
export type ItemStatus = 'pendiente' | 'en progreso' | 'en pruebas' | 'terminado';
export type Priority = 'baja' | 'media' | 'alta';

export interface Epic {
  id: number;
  titulo: string;
  descripcion: string;
  estado: 'pendiente' | 'en progreso' | 'terminado';
  proyecto: number;
  fecha_creacion: string;
}

export interface AcceptanceCriterion {
  id: number;
  descripcion: string;
  completado: boolean;
  historia: number;
}

export interface UserStory {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  estado: ItemStatus;
  epica?: number | null;
  sprint?: number | null;
  proyecto: number;
  proyecto_detalle?: Project | null;
  asignado_a?: number | null;
  asignado_a_detalle?: User | null;
  fecha_creacion: string;
  criterios: AcceptanceCriterion[];
  comentarios_count: number;
  adjuntos_count: number;
  horas_estimadas?: number;
  horas_reales?: number;
  puntos?: number | null;
}

// Task & Bug Types
export type TaskStatus = 'pendiente' | 'en progreso' | 'terminado';
export type BugStatus = 'nuevo' | 'en progreso' | 'corregido' | 'cerrado';

export interface Task {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  estado: TaskStatus;
  fecha_creacion: string;
  historia?: number | null;
  proyecto?: number | null;
  sprint?: number | null;
  asignado_a?: number | null;
  asignado_a_detalle?: User | null;
  horas_estimadas?: number;
  horas_reales?: number;
}

export interface Bug {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: Priority;
  estado: BugStatus;
  fecha_creacion: string;
  proyecto: number;
  historia?: number | null;
  sprint?: number | null;
  asignado_a?: number | null;
  asignado_a_detalle?: User | null;
  horas_estimadas?: number;
  horas_reales?: number;
}

// UI Types
export interface Comment {
  id: number;
  contenido: string;
  fecha_creacion: string;
  usuario: number;
  usuario_detalle: User;
  historia?: number;
  proyecto?: number;
}

export interface Attachment {
  id: number;
  nombre_archivo: string;
  url_archivo: string;
  tipo_archivo: string;
  fecha_subida: string;
  historia: number;
  subido_por: number;
  subido_por_detalle: User;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface PublicProfileData {
  user: User;
  projects: Project[];
}

export interface MyWorkItems {
    historias: UserStory[];
    tareas: Task[];
    bugs: Bug[];
}
