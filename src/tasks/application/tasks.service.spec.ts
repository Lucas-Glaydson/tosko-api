import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TASK_REPOSITORY_PORT } from '../domain/ports/outbound/task-repository.port';
import { TaskEntity } from '../domain/entities/task.entity';
import { TaskStatus } from '../domain/value-objects/task-status.vo';
import { TaskPriority } from '../domain/value-objects/task-priority.vo';

const makeTask = (overrides: Partial<{
  id: string; userId: string; title: string; version: number; deleted: boolean;
}> = {}): TaskEntity =>
  new TaskEntity(
    overrides.id ?? 'task-id-1',
    overrides.userId ?? 'user-id-1',
    overrides.title ?? 'Estudar NestJS',
    'Módulo de testes',
    60,
    TaskStatus.TODO,
    TaskPriority.HIGH,
    undefined,
    new Date('2026-06-11'),
    new Date('2026-06-11'),
    overrides.deleted ?? false,
    overrides.version ?? 1,
  );

describe('TasksService', () => {
  let service: TasksService;

  const mockTaskRepository = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    softDeleteMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TASK_REPOSITORY_PORT, useValue: mockTaskRepository },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('deve retornar lista de tarefas', async () => {
      const tasks = [makeTask(), makeTask({ id: 'task-id-2', title: 'Outra tarefa' })];
      mockTaskRepository.findAll.mockResolvedValue(tasks);

      const result = await service.findAll('user-id-1', {});

      expect(mockTaskRepository.findAll).toHaveBeenCalledWith('user-id-1', {});
      expect(result).toHaveLength(2);
    });
  });

  describe('findOne', () => {
    it('deve retornar tarefa quando encontrada', async () => {
      const task = makeTask();
      mockTaskRepository.findOne.mockResolvedValue(task);

      const result = await service.findOne('user-id-1', 'task-id-1');

      expect(mockTaskRepository.findOne).toHaveBeenCalledWith('user-id-1', 'task-id-1');
      expect(result).toBe(task);
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('user-id-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne('user-id-1', 'nonexistent')).rejects.toThrow(
        'Tarefa não encontrada',
      );
    });
  });

  describe('create', () => {
    it('deve criar e retornar a tarefa', async () => {
      const input = { title: 'Nova tarefa', priority: TaskPriority.MEDIUM };
      const created = makeTask({ title: 'Nova tarefa' });
      mockTaskRepository.create.mockResolvedValue(created);

      const result = await service.create('user-id-1', input);

      expect(mockTaskRepository.create).toHaveBeenCalledWith('user-id-1', input);
      expect(result).toBe(created);
    });
  });

  describe('bulkCreate', () => {
    it('deve criar múltiplas tarefas com sucesso', async () => {
      const inputs = [
        { title: 'Tarefa 1' },
        { title: 'Tarefa 2' },
        { title: 'Tarefa 3' },
      ];
      const created = inputs.map((i, idx) => makeTask({ id: `task-${idx}`, title: i.title }));
      mockTaskRepository.createMany.mockResolvedValue(created);

      const result = await service.bulkCreate('user-id-1', inputs);

      expect(mockTaskRepository.createMany).toHaveBeenCalledWith('user-id-1', inputs);
      expect(result).toHaveLength(3);
    });

    it('deve retornar array vazio quando nenhuma tarefa é inserida', async () => {
      mockTaskRepository.createMany.mockResolvedValue([]);

      const result = await service.bulkCreate('user-id-1', []);

      expect(result).toEqual([]);
    });
  });

  describe('update (optimistic locking)', () => {
    const input = { title: 'Título atualizado', status: TaskStatus.IN_PROGRESS };

    it('deve atualizar sem versão (sem locking)', async () => {
      const updated = makeTask({ version: 2 });
      mockTaskRepository.update.mockResolvedValue(updated);

      const result = await service.update('user-id-1', 'task-id-1', input);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        'user-id-1',
        'task-id-1',
        input,
        undefined,
      );
      expect(result.version).toBe(2);
    });

    it('deve atualizar com versão correta (optimistic locking sucesso)', async () => {
      const updated = makeTask({ version: 2 });
      mockTaskRepository.update.mockResolvedValue(updated);

      const result = await service.update('user-id-1', 'task-id-1', input, 1);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        'user-id-1',
        'task-id-1',
        input,
        1,
      );
      expect(result.version).toBe(2);
    });

    it('deve propagar NotFoundException quando versão está desatualizada (conflito de versão)', async () => {
      mockTaskRepository.update.mockRejectedValue(
        new NotFoundException('Tarefa não encontrada ou versão desatualizada'),
      );

      await expect(
        service.update('user-id-1', 'task-id-1', input, 999),
      ).rejects.toThrow(NotFoundException);

      await expect(
        service.update('user-id-1', 'task-id-1', input, 999),
      ).rejects.toThrow('Tarefa não encontrada ou versão desatualizada');
    });
  });

  describe('softDelete', () => {
    it('deve fazer soft delete e retornar tarefa', async () => {
      const deleted = makeTask({ deleted: true });
      mockTaskRepository.softDelete.mockResolvedValue(deleted);

      const result = await service.softDelete('user-id-1', 'task-id-1');

      expect(mockTaskRepository.softDelete).toHaveBeenCalledWith('user-id-1', 'task-id-1');
      expect(result.deleted).toBe(true);
    });

    it('deve lançar NotFoundException quando tarefa não existe', async () => {
      mockTaskRepository.softDelete.mockResolvedValue(null);

      await expect(service.softDelete('user-id-1', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('bulkSoftDelete', () => {
    it('deve retornar contagem de tarefas deletadas', async () => {
      mockTaskRepository.softDeleteMany.mockResolvedValue(3);

      const result = await service.bulkSoftDelete('user-id-1', ['id-1', 'id-2', 'id-3']);

      expect(mockTaskRepository.softDeleteMany).toHaveBeenCalledWith(
        'user-id-1',
        ['id-1', 'id-2', 'id-3'],
      );
      expect(result).toEqual({ deleted: 3 });
    });

    it('deve retornar zero quando nenhuma tarefa é deletada', async () => {
      mockTaskRepository.softDeleteMany.mockResolvedValue(0);

      const result = await service.bulkSoftDelete('user-id-1', ['id-inexistente']);

      expect(result).toEqual({ deleted: 0 });
    });
  });
});
