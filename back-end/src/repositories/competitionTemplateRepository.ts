import { Prisma } from '@prisma/client';
import { prisma } from '../database/prisma';
import { createObjectId } from './ids';
import { mapCompetitionTemplate } from './prismaMappers';

type CompetitionTemplateInput = {
  name: string;
  description?: string;
  battles: unknown;
};

const toJson = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export const competitionTemplateRepository = {
  async findAll() {
    const templates = await prisma.competitionTemplate.findMany({
      orderBy: [{ name: 'asc' }]
    });
    return templates.map(mapCompetitionTemplate);
  },

  async findById(id: string) {
    const template = await prisma.competitionTemplate.findUnique({ where: { id } });
    return template ? mapCompetitionTemplate(template) : null;
  },

  async create(input: CompetitionTemplateInput) {
    const template = await prisma.competitionTemplate.create({
      data: {
        id: createObjectId(),
        name: input.name,
        description: input.description || '',
        battles: toJson(input.battles)
      }
    });
    return mapCompetitionTemplate(template);
  },

  async update(id: string, input: Partial<CompetitionTemplateInput>) {
    const existing = await prisma.competitionTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    const template = await prisma.competitionTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description || '' } : {}),
        ...(input.battles !== undefined ? { battles: toJson(input.battles) } : {})
      }
    });
    return mapCompetitionTemplate(template);
  },

  async delete(id: string) {
    const existing = await prisma.competitionTemplate.findUnique({ where: { id } });
    if (!existing) return null;

    await prisma.competitionTemplate.delete({ where: { id } });
    return mapCompetitionTemplate(existing);
  }
};
