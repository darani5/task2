/*
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import {
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Select,
  Group,
} from "@mantine/core";

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("user")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        // Signup API call
        await axios.post("http://localhost:5000/api/users", form);
        notifications.show({
          title: "Signup Successful",
          message: "You can now login with your credentials",
          color: "green",
        });
        setIsSignup(false);
        setForm({ name: "", email: "", password: "", role: "user" });
      } else {
        // Login API call
        const { data } = await axios.post("http://localhost:5000/api/login", {
          email: form.email,
          password: form.password,
        });
        localStorage.setItem("user", JSON.stringify(data.user));
        notifications.show({
          title: "Login Success",
          message: `Welcome, ${data.user.name}`,
          color: "green",
        });
        navigate("/dashboard");
      }
    } catch (err) {
      notifications.show({
        title: isSignup ? "Signup Failed" : "Login Failed",
        message: err?.response?.data?.message || "Something went wrong",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center">{isSignup ? "Signup" : "Login"}</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <TextInput
                label="Name"
                placeholder="Your name"
                required
                value={form.name}
                onChange={handleChange("name")}
                mt="sm"
              />
              <Select
                label="Role"
                data={[
                  { value: "user", label: "User" },
                  { value: "admin", label: "Admin" },
                ]}
                value={form.role}
                onChange={(value) => setForm({ ...form, role: value })}
                required
                mt="sm"
              />
            </>
          )}
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={handleChange("email")}
            mt="sm"
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            value={form.password}
            onChange={handleChange("password")}
            mt="sm"
          />
          <Button
            fullWidth
            mt="xl"
            type="submit"
            loading={loading}
            disabled={loading}
          >
            {isSignup ? "Signup" : "Login"}
          </Button>
        </form>
        <Group position="center" mt="md">
          <Button variant="subtle" onClick={() => setIsSignup(!isSignup)}>
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Signup"}
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default AuthPage;

*/
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import {
  Container,
  Title,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Select,
  Group,
} from "@mantine/core";
import api from "./api"; // your axios instance

function AuthPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        // Signup API call
        await api.post("/register", form);
        notifications.show({
          title: "Signup Successful",
          message: "You can now login with your credentials",
          color: "green",
        });
        setIsSignup(false);
        setForm({ name: "", email: "", password: "", role: "user" });
      } else {
        // Login API call
        const { data } = await api.post("/login", {
          email: form.email,
          password: form.password,
        });

        // Save JWT token and user info to localStorage
        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          notifications.show({
            title: "Login Success",
            message: `Welcome, ${data.user.name}`,
            color: "green",
          });
          navigate("/dashboard");
        } else {
          throw new Error("Invalid login response from server");
        }
      }
    } catch (err) {
      notifications.show({
        title: isSignup ? "Signup Failed" : "Login Failed",
        message:
          err?.response?.data?.message || err.message || "Something went wrong",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center">{isSignup ? "Signup" : "Login"}</Title>
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <TextInput
                label="Name"
                placeholder="Your name"
                required
                value={form.name}
                onChange={handleChange("name")}
                mt="sm"
              />
              <Select
                label="Role"
                data={[
                  { value: "user", label: "User" },
                  { value: "admin", label: "Admin" },
                ]}
                value={form.role}
                onChange={(value) => setForm({ ...form, role: value })}
                required
                mt="sm"
              />
            </>
          )}
          <TextInput
            label="Email"
            placeholder="you@example.com"
            required
            value={form.email}
            onChange={handleChange("email")}
            mt="sm"
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            value={form.password}
            onChange={handleChange("password")}
            mt="sm"
          />
          <Button fullWidth mt="xl" type="submit" loading={loading} disabled={loading}>
            {isSignup ? "Signup" : "Login"}
          </Button>
        </form>
        <Group position="center" mt="md">
          <Button variant="subtle" onClick={() => setIsSignup(!isSignup)}>
            {isSignup
              ? "Already have an account? Login"
              : "Don't have an account? Signup"}
          </Button>
        </Group>
      </Paper>
    </Container>
  );
}

export default AuthPage;
