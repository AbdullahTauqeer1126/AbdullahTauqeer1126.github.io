
import { UserService } from './src/services/user.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkRoles() {
  const service = new UserService();
  try {
    const users = await service.getAllUsers();
    console.log('--- USER ROLES IN DB ---');
    const roles = [...new Set(users.map(u => u.role))];
    console.log('Roles found:', roles);
    console.log('Total users:', users.length);
    console.log('Sample users:', users.slice(0, 5).map(u => ({ name: u.first_name, role: u.role })));
  } catch (err) {
    console.error('Error:', err);
  }
}

checkRoles();
