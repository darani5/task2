import {
  Table,
  Button,
  Group,
  Modal,
  TextInput,
  Select,
  Container,
  Box,
  Textarea,
  MultiSelect,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const TASK_STATUSES = ["To Do", "In Progress", "Done"];

const fetchProjects = async () => {
  const { data } = await axios.get("http://localhost:5000/api/projects");
  return data;
};

const fetchTasks = async () => {
  const { data } = await axios.get("http://localhost:5000/api/tasks");
  return data;
};

function ProjectTaskManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [view, setView] = useState("projects"); // "projects" or "tasks"

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
  });

  const [projectModalOpened, projectModalHandlers] = useDisclosure(false);
  const [taskModalOpened, taskModalHandlers] = useDisclosure(false);

  const [projectForm, setProjectForm] = useState({
    id: null,
    name: "",
    description: "",
  });

  const [taskForm, setTaskForm] = useState({
    id: null,
    title: "",
    description: "",
    status: "To Do",
    deadline: "",
    tags: [],
    projectId: null,
    comments: "",
     completed: false,
  });

  const saveProject = useMutation({
    mutationFn: (project) =>
      project.id
        ? axios.put(`http://localhost:5000/api/projects/${project.id}`, project)
        : axios.post("http://localhost:5000/api/projects", project),
    onSuccess: () => {
      notifications.show({ title: "Success", message: "Project saved", color: "green" });
      queryClient.invalidateQueries(["projects"]);
      projectModalHandlers.close();
    },
    onError: () => {
      notifications.show({ title: "Error", message: "Failed to save project", color: "red" });
    },
  });

  const deleteProject = useMutation({
    mutationFn: (id) => axios.delete(`http://localhost:5000/api/projects/${id}`),
    onSuccess: () => {
      notifications.show({ title: "Deleted", message: "Project deleted", color: "red" });
      queryClient.invalidateQueries(["projects"]);
    },
  });

  const saveTask = useMutation({
    mutationFn: (task) =>
      task.id
        ? axios.put(`http://localhost:5000/api/tasks/${task.id}`, task)
        : axios.post("http://localhost:5000/api/tasks", task),
    onSuccess: () => {
      notifications.show({ title: "Success", message: "Task saved", color: "green" });
      queryClient.invalidateQueries(["tasks"]);
      taskModalHandlers.close();
    },
    onError: () => {
      notifications.show({ title: "Error", message: "Failed to save task", color: "red" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id) => axios.delete(`http://localhost:5000/api/tasks/${id}`),
    onSuccess: () => {
      notifications.show({ title: "Deleted", message: "Task deleted", color: "red" });
      queryClient.invalidateQueries(["tasks"]);
    },
  });

  const confirmDeleteProject = (p) => {
    if (window.confirm(`Delete project "${p.name}"? This will also remove tasks under it.`)) {
      deleteProject.mutate(p.id);
    }
  };

  const confirmDeleteTask = (t) => {
    if (window.confirm(`Delete task "${t.title}"?`)) {
      deleteTask.mutate(t.id);
    }
  };

  // --- LOGOUT FUNCTION ---
  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Render Projects Table
  const renderProjectsTable = () => (
    <Box style={{ marginTop: 20 }}>
      <Group position="apart" mb="md">
        <h2>Projects</h2>
        <Button
          onClick={() => {
            setProjectForm({ id: null, name: "", description: "" });
            projectModalHandlers.open();
          }}
        >
          Add Project
        </Button>
      </Group>

      <Table striped highlightOnHover withColumnBorders>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Tasks Count</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.description}</td>
              <td>{tasks.filter((t) => t.projectId === p.id).length}</td>
              <td>
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setProjectForm(p);
                      projectModalHandlers.open();
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="xs" variant="outline" color="red" onClick={() => confirmDeleteProject(p)}>
                    Delete
                  </Button>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );

  // Render Tasks Table
  const renderTasksTable = () => (
    <Box style={{ marginTop: 20 }}>
      <Group position="apart" mb="md">
        <h2>Tasks</h2>
        <Button
          onClick={() => {
            setTaskForm({
              id: null,
              title: "",
              description: "",
              status: "To Do",
              deadline: "",
              tags: [],
              projectId: projects.length > 0 ? projects[0].id : null,
              comments: "",
            });
            taskModalHandlers.open();
          }}
          disabled={projects.length === 0}
          title={projects.length === 0 ? "Add a project first" : ""}
        >
          Add Task
        </Button>
      </Group>

      <Table striped highlightOnHover withColumnBorders>
        <thead>
          <tr>
            <th>Title</th>
            <th>Description</th>
            <th>Project</th>
            <th>Status</th>
            <th>Deadline</th>
            <th>Tags</th>
            <th>Comments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.description}</td>
              <td>{projects.find((p) => p.id === t.projectId)?.name || "-"}</td>
              <td>
                <Badge
                  color={
                    t.status === "Done" ? "green" : t.status === "In Progress" ? "blue" : "gray"
                  }
                >
                  {t.status}
                </Badge>
              </td>
              <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : "-"}</td>
              <td>
                {Array.isArray(t.tags) ? (
                  t.tags.map((tag) => (
                    <Badge key={tag} size="xs" mr={3}>
                      {tag}
                    </Badge>
                  ))
                ) : (
                  "-"
                )}
              </td>
              <td>{t.comments || "-"}</td>
              <td>
                <Group spacing="xs">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => {
                      setTaskForm({
                        ...t,
                        deadline: t.deadline ? t.deadline.split("T")[0] : "",
                        // Ensure tags is an array
                        tags: Array.isArray(t.tags)
                          ? t.tags
                          : typeof t.tags === "string"
                          ? t.tags.split(",").map((tag) => tag.trim())
                          : [],
                        comments: t.comments || "",
                          completed: !!t.completed,
                      });
                      taskModalHandlers.open();
                    }}
                  >
                    Edit
                  </Button>
                  <Button size="xs" variant="outline" color="red" onClick={() => confirmDeleteTask(t)}>
                    Delete
                  </Button>
                </Group>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Box>
  );

  return (
    <Container size="md" px="md" style={{ marginTop: "20px" }}>
      <Group position="apart" mb="md" align="center">
        <h1>Task & Project Management</h1>
        <Button color="red" onClick={handleLogout}>
          Logout
        </Button>
      </Group>

      <Group position="apart" mb="md">
        <Button variant={view === "projects" ? "filled" : "outline"} onClick={() => setView("projects")}>
          Projects
        </Button>
        <Button variant={view === "tasks" ? "filled" : "outline"} onClick={() => setView("tasks")}>
          Tasks
        </Button>
      </Group>

      {view === "projects" && renderProjectsTable()}
      {view === "tasks" && renderTasksTable()}

      {/* Project Modal */}
      <Modal
        opened={projectModalOpened}
        onClose={projectModalHandlers.close}
        title={projectForm.id ? "Edit Project" : "Add Project"}
        centered
        styles={{
          modal: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          },
          body: {
            width: "100%",
            maxWidth: 500,
            margin: "auto",
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProject.mutate(projectForm);
          }}
        >
          <TextInput
            label="Project Name"
            value={projectForm.name}
            onChange={(e) => setProjectForm({ ...projectForm, name: e.currentTarget.value })}
            required
            mb="sm"
          />
          <Textarea
            label="Description"
            value={projectForm.description}
            onChange={(e) => setProjectForm({ ...projectForm, description: e.currentTarget.value })}
            mb="sm"
          />
          <Group position="right" mt="md">
            <Button type="submit">{projectForm.id ? "Update" : "Create"}</Button>
          </Group>
        </form>
      </Modal>

      {/* Task Modal */}
      <Modal
        opened={taskModalOpened}
        onClose={taskModalHandlers.close}
        title={taskForm.id ? "Edit Task" : "Add Task"}
        centered
        styles={{
          modal: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "60vh",
          },
          body: {
            width: "100%",
            maxWidth: 500,
            margin: "auto",
          },
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveTask.mutate(taskForm);
          }}
        >
          <TextInput
            label="Title"
            value={taskForm.title}
            onChange={(e) => setTaskForm({ ...taskForm, title: e.currentTarget.value })}
            required
            mb="sm"
          />
          <Textarea
            label="Description"
            value={taskForm.description}
            onChange={(e) => setTaskForm({ ...taskForm, description: e.currentTarget.value })}
            mb="sm"
          />
          <Select
            label="Status"
            data={TASK_STATUSES}
            value={taskForm.status}
            onChange={(value) => setTaskForm({ ...taskForm, status: value })}
            required
            mb="sm"
          />
          <TextInput
            label="Deadline"
            type="date"
            value={taskForm.deadline}
            onChange={(e) => setTaskForm({ ...taskForm, deadline: e.currentTarget.value })}
            mb="sm"
          />
          <Textarea
            label="Comments"
            placeholder="Add any notes or comments..."
            value={taskForm.comments}
            onChange={(e) => setTaskForm({ ...taskForm, comments: e.currentTarget.value })}
            mb="sm"
          />
          <MultiSelect
            label="Tags"
            placeholder="Add tags"
            searchable
            creatable
            getCreateLabel={(query) => `+ Create tag "${query}"`}
            onCreate={(query) => {
              setTaskForm({ ...taskForm, tags: [...taskForm.tags, query] });
              return query;
            }}
            value={taskForm.tags}
            onChange={(value) => setTaskForm({ ...taskForm, tags: value })}
            mb="sm"
          />
          <Select
            label="Project"
            data={projects.map((p) => ({ value: p.id, label: p.name }))}
            value={taskForm.projectId}
            onChange={(value) => setTaskForm({ ...taskForm, projectId: value })}
            required
            mb="sm"
          />
          <Group position="right" mt="md">
            <Button type="submit">{taskForm.id ? "Update" : "Create"}</Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
}

export default ProjectTaskManagement;
