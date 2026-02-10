# Project Management Tool

A **production-ready, enterprise-grade project management platform** built with Next.js 14, Supabase, and TypeScript. Features real-time collaboration, comprehensive task management, team communication, and role-based access control.

## 🚀 Features

- ✅ **Authentication**: Email/password, Google OAuth, and magic links
- 👥 **Multi-tenant**: Organization-based isolation with role-based permissions
- 📊 **Project Management**: Workspaces, projects, and tasks with Kanban/List/Calendar views
- 💬 **Real-time Collaboration**: Live updates, comments, and notifications
- 📎 **File Management**: Secure file uploads with Supabase Storage
- 🔔 **Notifications**: In-app and email notifications
- 📝 **Activity Tracking**: Comprehensive audit logs
- 🎨 **Modern UI**: Beautiful, responsive design with dark mode
- 🔒 **Enterprise Security**: Row Level Security (RLS) policies

## 📋 Prerequisites

- Node.js 18+ and npm
- A Supabase account ([sign up here](https://supabase.com))
- (Optional) Google Cloud Console account for OAuth

## 🛠️ Installation

### 1. Clone and Install Dependencies

```bash
cd d:/A1/ProjectManagement-Tool
npm install
```

### 2. Set Up Supabase

#### Create a New Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in your project details:
   - **Name**: `project-management-tool`
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

#### Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Run each migration file in order:
   - Copy the contents of `supabase/migrations/001_initial_schema.sql`
   - Paste into SQL Editor and click "Run"
   - Repeat for:
     - `002_rls_policies.sql`
     - `003_functions_triggers.sql`
     - `004_storage_setup.sql`

#### (Optional) Add Seed Data

For testing, run the seed data:
```sql
-- Copy contents of supabase/seed.sql and run in SQL Editor
```

### 3. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.local.example .env.local
```

2. Get your Supabase credentials:
   - Go to **Project Settings** > **API**
   - Copy **Project URL** and **anon public** key

3. Update `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. (Optional) Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     - `https://your-project.supabase.co/auth/v1/callback`
6. Copy **Client ID** and **Client Secret**
7. In Supabase Dashboard:
   - Go to **Authentication** > **Providers**
   - Enable **Google**
   - Paste Client ID and Secret
   - Save

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
d:/A1/ProjectManagement-Tool/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── workspaces/
│   │   ├── projects/
│   │   ├── tasks/
│   │   ├── team/
│   │   ├── notifications/
│   │   └── settings/
│   ├── auth/callback/            # OAuth callback
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                       # ShadCN UI components
│   ├── layout/                   # Layout components
│   ├── dashboard/                # Dashboard widgets
│   ├── workspace/                # Workspace components
│   ├── project/                  # Project components
│   ├── task/                     # Task components
│   └── shared/                   # Shared components
├── lib/
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware helper
│   ├── hooks/                    # Custom React hooks
│   ├── utils/                    # Utility functions
│   └── constants/                # Constants
├── types/
│   ├── database.types.ts         # Generated Supabase types
│   └── entities.ts               # Entity types
├── supabase/
│   ├── migrations/               # SQL migrations
│   └── seed.sql                  # Seed data
├── middleware.ts                 # Next.js middleware
├── next.config.js
├── tailwind.config.ts
└── package.json
```

## 🗄️ Database Schema

### Core Tables

- **organizations**: Multi-tenant organizations
- **users**: Extended user profiles with roles
- **workspaces**: Project grouping containers
- **projects**: Core project entities
- **tasks**: Task management with metadata
- **comments**: Threaded discussions
- **attachments**: File references
- **notifications**: In-app notifications
- **activity_logs**: Audit trail
- **project_members**: Project-level permissions

### User Roles

- **Owner**: Full access to everything
- **Admin**: Manage members, create/edit projects
- **Manager**: Create projects, manage assigned tasks
- **Member**: Edit assigned tasks only
- **Viewer**: Read-only access

## 🚀 Deployment

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables from `.env.local`
5. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up HTTPS
- Provide a production URL

### Option 2: Custom VPS

#### Requirements
- Ubuntu 20.04+ or similar
- 4GB RAM minimum
- Node.js 18+
- Nginx

#### Setup Steps

1. **Install Node.js**:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Clone and build**:
```bash
git clone your-repo-url /var/www/project-management-tool
cd /var/www/project-management-tool
npm install
npm run build
```

3. **Install PM2**:
```bash
sudo npm install -g pm2
pm2 start npm --name "pm-tool" -- start
pm2 save
pm2 startup
```

4. **Configure Nginx**:
```nginx
server {
    listen 80;
    server_name pm.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Enable HTTPS with Let's Encrypt**:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d pm.yourdomain.com
```

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production (test)
npm run build
```

## 📚 Usage Guide

### First-Time Setup

1. **Sign Up**: Create an account at `/signup`
   - Enter your details and organization name
   - You'll be assigned the "Owner" role automatically

2. **Create a Workspace**:
   - Go to Dashboard > Workspaces
   - Click "Create Workspace"
   - Add name and description

3. **Create a Project**:
   - Open your workspace
   - Click "Create Project"
   - Set priority and dates

4. **Add Tasks**:
   - Open your project
   - Use Kanban board to add tasks
   - Drag and drop to change status
   - Assign to team members

5. **Invite Team Members**:
   - Go to Team page
   - Click "Invite Member"
   - Enter email and select role
   - They'll receive an invitation

## 🔧 Configuration

### Supabase Storage

Storage buckets are automatically created:
- `avatars`: User profile pictures (public)
- `attachments`: Task file uploads (private)
- `organization-assets`: Logos and branding (public)

### Email Notifications

Configure SMTP in Supabase:
1. Go to **Project Settings** > **Auth**
2. Scroll to **SMTP Settings**
3. Enter your SMTP credentials
4. Test email delivery

## 🐛 Troubleshooting

### "Invalid API key" error
- Check that your `.env.local` has correct Supabase URL and keys
- Restart the dev server after changing environment variables

### Database errors
- Ensure all migrations ran successfully in order
- Check Supabase logs in Dashboard > Database > Logs

### OAuth not working
- Verify redirect URIs match exactly in Google Console and Supabase
- Check that Google provider is enabled in Supabase Auth settings

### Build errors
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Check Node.js version: `node -v` (should be 18+)

## 📝 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Supabase documentation: [https://supabase.com/docs](https://supabase.com/docs)
3. Check Next.js documentation: [https://nextjs.org/docs](https://nextjs.org/docs)

## 🎯 Next Steps

After basic setup, you can:
- Customize the UI theme in `tailwind.config.ts`
- Add more OAuth providers (GitHub, Microsoft, etc.)
- Set up webhooks for integrations
- Configure Slack notifications
- Add custom fields to tasks
- Implement time tracking
- Create custom reports

---

**Built with ❤️ using Next.js 14, Supabase, and TypeScript**
