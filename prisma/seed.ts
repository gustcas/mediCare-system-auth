import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding auth database...');

  const roles = await Promise.all([
    prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Administrador del sistema' } }),
    prisma.role.upsert({ where: { name: 'DOCTOR' }, update: {}, create: { name: 'DOCTOR', description: 'Médico' } }),
    prisma.role.upsert({ where: { name: 'NURSE' }, update: {}, create: { name: 'NURSE', description: 'Enfermero/a' } }),
    prisma.role.upsert({ where: { name: 'RECEPTIONIST' }, update: {}, create: { name: 'RECEPTIONIST', description: 'Recepcionista' } }),
    prisma.role.upsert({ where: { name: 'PATIENT' }, update: {}, create: { name: 'PATIENT', description: 'Paciente' } }),
  ]);

  const resources = ['patients', 'doctors', 'appointments', 'clinical_notes', 'prescriptions', 'lab_results', 'billing', 'users', 'reports'];
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'] as const;

  const permissions = [];
  for (const resource of resources) {
    for (const action of actions) {
      const perm = await prisma.permission.upsert({
        where: { resource_action: { resource, action } },
        update: {},
        create: { resource, action, description: `${action} ${resource}` },
      });
      permissions.push(perm);
    }
  }

  const adminRole = roles.find(r => r.name === 'ADMIN')!;
  for (const perm of permissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const doctorRole = roles.find(r => r.name === 'DOCTOR')!;
  const doctorResources = ['patients', 'appointments', 'clinical_notes', 'prescriptions', 'lab_results'];
  const doctorPerms = permissions.filter(p => doctorResources.includes(p.resource));
  for (const perm of doctorPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: doctorRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: doctorRole.id, permissionId: perm.id },
    });
  }

  const nurseRole = roles.find(r => r.name === 'NURSE')!;
  const nursePerms = permissions.filter(p => ['patients', 'appointments', 'lab_results'].includes(p.resource) && ['READ', 'UPDATE'].includes(p.action));
  for (const perm of nursePerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: nurseRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: nurseRole.id, permissionId: perm.id },
    });
  }

  const receptionistRole = roles.find(r => r.name === 'RECEPTIONIST')!;
  const receptionistPerms = permissions.filter(p => ['patients', 'appointments'].includes(p.resource));
  for (const perm of receptionistPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: receptionistRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: receptionistRole.id, permissionId: perm.id },
    });
  }

  const passwordHash = await bcrypt.hash('Admin@2024!', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@medicare.com' },
    update: {},
    create: {
      email: 'admin@medicare.com',
      passwordHash,
      documentType: 'DNI',
      documentNumber: '00000001',
      firstName: 'Admin',
      lastName: 'Sistema',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: {},
    create: { userId: adminUser.id, roleId: adminRole.id },
  });

  const doctorHash = await bcrypt.hash('Doctor@2024!', 12);
  const doctorUser = await prisma.user.upsert({
    where: { email: 'doctor@medicare.com' },
    update: {},
    create: {
      email: 'doctor@medicare.com',
      passwordHash: doctorHash,
      documentType: 'DNI',
      documentNumber: '00000002',
      firstName: 'Roberto',
      lastName: 'Gómez',
      isActive: true,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: doctorUser.id, roleId: doctorRole.id } },
    update: {},
    create: { userId: doctorUser.id, roleId: doctorRole.id },
  });

  console.log('✅ Seed completado');
  console.log('   admin@medicare.com / Admin@2024!');
  console.log('   doctor@medicare.com / Doctor@2024!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
