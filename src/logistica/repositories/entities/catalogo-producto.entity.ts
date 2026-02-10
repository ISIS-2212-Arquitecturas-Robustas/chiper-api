import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Catalogo } from './catalogo.entity';
import { Producto } from './producto.entity';

@Entity('catalogo_producto')
export class CatalogoProducto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  catalogoId: string;

  @Column('uuid')
  productoId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Catalogo, (catalogo) => catalogo.productos)
  @JoinColumn({ name: 'catalogoId' })
  catalogo: Catalogo;

  @ManyToOne(() => Producto, (producto) => producto.catalogos)
  @JoinColumn({ name: 'productoId' })
  producto: Producto;
}
