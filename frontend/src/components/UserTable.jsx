
import {
  Table,
  Button,
  Group,
  Switch,
  Modal,
  TextInput,
  Select,
  Container,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notifications } from "@mantine/notifications";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const fetchUsers = async () => {
  const { data } = await axios.get("http://localhost:5000/api/users");
  return data;
};

function UserTable() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dynamically get user role from localStorage (fallback to "user")
  const CURRENT_USER_ROLE =
    JSON.parse(localStorage.getItem("user"))?.role || "user";

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  const [modalOpened, { open, close }] = useDisclosure(false);
  const [deleteModalOpened, deleteModalHandlers] = useDisclosure(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const [form, setForm] = useState({
    id: null,
    name: "",
    email: "",
    role: "admin",
    status: "active",
  });

  const saveUser = useMutation({
    mutationFn: (user) => {
      if (user.id) {
        return axios.put(`http://localhost:5000/api/users/${user.id}`, user);
      } else {
        return axios.post("http://localhost:5000/api/users", user);
      }
    },
    onSuccess: () => {
      notifications.show({
        title: "Success",
        message: "User saved",
        color: "green",
        size: "sm",
        position: "top-center",
        style: { fontSize: "12px", padding: "5px 10px" },
      });
      queryClient.invalidateQueries(["users"]);
      close();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to save user",
        color: "red",
        size: "sm",
        position: "top-center",
        style: { fontSize: "12px", padding: "5px 10px" },
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id) => axios.delete(`http://localhost:5000/api/users/${id}`),
    onSuccess: () => {
      notifications.show({
        title: "Deleted",
        message: "User removed",
        color: "red",
        size: "xs",
        position: "top-center",
        style: { fontSize: "12px", padding: "5px 10px" },
      });
      queryClient.invalidateQueries(["users"]);
      deleteModalHandlers.close();
      setUserToDelete(null);
    },
  });

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    deleteModalHandlers.open();
  };

  const performDelete = () => {
    if (userToDelete) {
      deleteUser.mutate(userToDelete.id);
    }
  };

  return (
    <>
      <Container
        size="md"
        px="md"
        style={{ marginTop: "0", marginLeft: "50px", paddingTop: "0" }}
      >
        <Group position="apart" mb="md">
          <h2>User Management</h2>
          <Group>
            {CURRENT_USER_ROLE === "admin" && (
              <Button
                onClick={() => {
                  setForm({
                    id: null,
                    name: "",
                    email: "",
                    role: "admin",
                    status: "active",
                  });
                  open();
                }}
              >
                Add User
              </Button>
            )}
            <Button color="red" variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </Group>
        </Group>

        <Box
          style={{
            marginTop: "0px",
            marginLeft: "20px",
            backgroundColor: "#1E3A8A",
            borderRadius: "8px",
            padding: "10px",
            color: "white",
          }}
        >
          <Table
            striped
            highlightOnHover
            withColumnBorders
            style={{
              minWidth: "700px",
              color: "white",
            }}
          >
            <thead>
              <tr>
                <th
                  style={{ padding: "10px", textAlign: "center", color: "white" }}
                >
                  Name
                </th>
                <th
                  style={{ padding: "10px", textAlign: "center", color: "white" }}
                >
                  Email
                </th>
                <th
                  style={{ padding: "10px", textAlign: "center", color: "white" }}
                >
                  Role
                </th>
                <th
                  style={{ padding: "10px", textAlign: "center", color: "white" }}
                >
                  Status
                </th>
                <th
                  style={{ padding: "10px", textAlign: "center", color: "white" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td
                    style={{ padding: "10px", textAlign: "center", color: "white" }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{ padding: "10px", textAlign: "center", color: "white" }}
                  >
                    {u.email}
                  </td>
                  <td
                    style={{ padding: "10px", textAlign: "center", color: "white" }}
                  >
                    {u.role}
                  </td>
                  <td
                    style={{ padding: "10px", textAlign: "center", color: "white" }}
                  >
                    <Switch
                      checked={u.status === "active"}
                      onChange={() =>
                        saveUser.mutate({
                          ...u,
                          status: u.status === "active" ? "inactive" : "active",
                        })
                      }
                      size="xs"
                      disabled={CURRENT_USER_ROLE !== "admin"} // only admin can toggle status
                    />
                  </td>
                  <td
                    style={{ padding: "10px", textAlign: "center", color: "white" }}
                  >
                    <Group spacing="xs" justify="center">
                      {/* Edit allowed for both admin and user */}
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setForm(u);
                          open();
                        }}
                      >
                        Edit
                      </Button>

                      {/* Delete only for admin */}
                      {CURRENT_USER_ROLE === "admin" && (
                        <Button
                          size="xs"
                          variant="outline"
                          color="red"
                          onClick={() => confirmDelete(u)}
                        >
                          Delete
                        </Button>
                      )}
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Box>
      </Container>

      <Modal
        opened={modalOpened}
        onClose={close}
        title={form.id ? "Edit User" : "Add User"}
        centered
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveUser.mutate(form);
          }}
        >
          <TextInput
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.currentTarget.value })}
            required
            mb="sm"
            disabled={CURRENT_USER_ROLE !== "admin" && form.id !== null} // disable edit except for admins or on create
          />
          <TextInput
            label="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.currentTarget.value })}
            required
            mb="sm"
            disabled={CURRENT_USER_ROLE !== "admin" && form.id !== null}
          />

          {/* Only admin can change role */}
          <Select
            label="Role"
            data={["admin", "editor", "viewer"]}
            value={form.role}
            onChange={(value) => setForm({ ...form, role: value })}
            required
            mb="sm"
            searchable
            withinPortal
            nothingFound="No roles"
            disabled={CURRENT_USER_ROLE !== "admin"} // disabled for non-admins
          />

          <Group position="right" mt="md">
            <Button type="submit">{form.id ? "Update" : "Create"}</Button>
          </Group>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={deleteModalHandlers.close}
        title="Confirm Delete"
        centered
      >
        <p>
          Are you sure you want to delete user "{userToDelete?.name}"?
        </p>
        <Group position="right" mt="md">
          <Button variant="outline" onClick={deleteModalHandlers.close}>
            Cancel
          </Button>
          <Button color="red" onClick={performDelete}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}

export default UserTable;
