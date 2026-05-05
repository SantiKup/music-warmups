<script setup lang="ts">
import { BookOpenText, Home, LockKeyhole, Music, Upload, X } from "lucide-vue-next";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "~~/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { isAuthorizedTeacher } from "~~/lib/teacher-emails";

const globalItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
]

const studentItems = [
  {
    title: "Choose Band Jam",
    url: "/student",
    icon: BookOpenText,
  },
];

const teacherItems = computed(() => {
  if (isTeacher) {
    return [
      {
        title: "Teacher Uploads",
        url: "/teacher/admin",
        icon: Upload,
      },
    ];
  }

  return [
    {
      title: "Teacher Login",
      url: "/teacher/login",
      icon: LockKeyhole,
    },
  ];
});

const session = authClient.useSession();
const user = computed(() => session.value.data?.user);
const userName = computed(() => user.value?.name || user.value?.email || "User");
const userEmail = computed(() => user.value?.email || "");
const userImage = computed(() => user.value?.image || "");
const initials = computed(() => {
  return userName.value
    .split(" ")
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const isStudentAuthenticated = computed(() => {
  const email = (userEmail.value || "").toLowerCase();
  return email.endsWith("@students.nido.cl");
});

const isTeacher = computed(() => {
  const email = (userEmail.value || "").toLowerCase();
  return isAuthorizedTeacher(email);
});

const { isMobile, setOpen, setOpenMobile } = useSidebar();

const closeSidebar = () => {
  if (isMobile.value) {
    setOpenMobile(false);
    return;
  }
  setOpen(false);
};

const handleSignOut = async () => {
  await authClient.signOut({
    fetchOptions: {
      onSuccess: () => {
        navigateTo("/");
        window.location.reload(); // Force UI update if needed
      },
    },
  });
};
</script>

<template>
  <Sidebar collapsible="offcanvas" :style="{
    '--sidebar': 'var(--color-surface)',
    '--sidebar-foreground': 'var(--color-ink)',
    '--sidebar-accent': 'rgba(31, 42, 55, 0.06)',
    '--sidebar-accent-foreground': 'var(--color-ink)',
    '--sidebar-border': 'var(--color-border)',
  }" class="**:data-[sidebar=sidebar]:bg-surface">
    <SidebarHeader class="border-b border-border bg-[linear-gradient(180deg,#fcfaf7,#f3f0eb)]">
      <div class="flex items-center justify-between gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-serif text-[1.1rem]">
          <Icon name="mdi:music-clef-treble" class="text-accent-ink" />
          <span class="tracking-[-0.02em]">BandJam</span>
        </NuxtLink>
        <button
          class="inline-flex items-center justify-center rounded-full border border-border bg-white p-2 text-foreground shadow-(--shadow-soft-sm) transition-[transform,box-shadow] duration-150 ease-(--ease) hover:-translate-y-px hover:shadow-[0_10px_18px_rgba(31,42,55,0.12)]"
          type="button" title="Close sidebar" @click="closeSidebar">
          <X class="h-4 w-4" />
        </button>
      </div>
      <p class="text-[0.85rem] text-muted">Pick your role and jump in.</p>
    </SidebarHeader>

    <SidebarContent class="gap-3">
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in globalItems" :key="item.title">
              <SidebarMenuButton as-child class="text-[0.98rem]">
                <NuxtLink :to="item.url" @click="closeSidebar">
                  <component :is="item.icon" />
                  <span class="font-medium">{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel class="font-serif text-[0.72rem] uppercase tracking-[0.16em] text-muted">
          Student
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in studentItems" :key="item.title">
              <SidebarMenuButton as-child class="text-[0.98rem]">
                <NuxtLink :to="item.url" @click="closeSidebar">
                  <component :is="item.icon" />
                  <span class="font-medium">{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel class="font-serif text-[0.72rem] uppercase tracking-[0.16em] text-muted">
          Teacher
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem v-for="item in teacherItems" :key="item.title">
              <SidebarMenuButton as-child class="text-[0.98rem]">
                <NuxtLink :to="item.url" @click="closeSidebar">
                  <component :is="item.icon" />
                  <span class="font-medium">{{ item.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem v-if="isTeacher" class="flex justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger class="cursor-pointer">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarImage :src="userImage" />
                  <AvatarFallback>{{ initials }}</AvatarFallback>
                </Avatar>
                <div>
                  <div class="text-[0.95rem] font-semibold">{{ userName }}</div>
                  <div class="text-[0.85rem] text-muted">Teacher account</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Teacher</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem @click="navigateTo('/teacher/admin')">
                Upload panel
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleSignOut">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem v-else-if="isStudentAuthenticated" class="flex justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger class="cursor-pointer">
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{{ initials }}</AvatarFallback>
                </Avatar>
                <div>
                  <div class="text-[0.95rem] font-semibold">{{ userName }}</div>
                  <div class="text-[0.85rem] text-muted">Student account</div>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Student</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {{ userEmail }}
              </DropdownMenuItem>
              <DropdownMenuItem @click="navigateTo('/student')">
                Back to selection
              </DropdownMenuItem>
              <DropdownMenuItem @click="handleSignOut">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <SidebarMenuItem v-else>
          <SidebarMenuButton as-child>
            <NuxtLink to="/teacher/login">
              <LockKeyhole class="mr-2 h-4 w-4" />
              <span class="font-medium">Teacher login</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>
</template>
