import { LatLngExpression } from 'leaflet';
import { CategoryTag } from './trip';

export interface MapPin {
  id: string;
  position: LatLngExpression;
  title: string;
  description?: string;
  categories: CategoryTag[];
  isScheduled: boolean;
}
