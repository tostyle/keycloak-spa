import Profile from "./Profile";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import "./ProfilePage.css";

function ProfilePage() {
  const [user, setUser] = useState(null);
  // const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => axios.get("/profile").then((res) => res.data),
  });

  const isAuthenticated = !!profileQuery.data && profileQuery.isFetched;
  // console.log("Profile Query Data:", profileQuery);

  const permissionQuery = useQuery({
    queryKey: ["permissions"],
    queryFn: () => axios.get("/permissions").then((res) => res.data),
    enabled: isAuthenticated,
  });
  const permissions = permissionQuery.data || [];

  const permissionGrantedQuery = useQuery({
    queryKey: ["permissionGranted"],
    queryFn: async () => {
      const grantedRequests = permissions
        .map((permission) => permission.split("#"))
        .map((accessControl) => {
          const [resource, action] = accessControl;
          return Promise.all([
            accessControl,
            axios.get(`/permissions/${resource}/${action ?? ""}`),
          ]);
        });
      const allGranted = await Promise.allSettled(grantedRequests);
      // console.log("All Granted Requests:", allGranted);
      const granted = allGranted.map((grant) => {
        const [accessControl, response] = grant.value;
        const [resource, action] = accessControl;
        return {
          resource,
          action,
          granted: response.status < 400,
        };
      });
      return granted;
    },
    enabled: permissions.length > 0, // This query is not automatically run
  });

  console.log("Permission Granted Query Data:", permissionGrantedQuery.data);

  const createMarketingQuery = useQuery({
    queryKey: ["createMarketing"],
    queryFn: () =>
      axios
        .post("/marketing")
        .then((res) => res.data)
        .catch((error) => {
          console.error("Error creating marketing:", error);
          throw error; // Rethrow the error to handle it in the UI
        }),
    enabled: isAuthenticated, // This query is not automatically run
  });

  const listMarketingQuery = useQuery({
    queryKey: ["listMarketing"],
    queryFn: () =>
      axios
        .get("/marketing")
        .then((res) => res.data)
        .catch((error) => {
          console.error("Error creating marketing:", error);
          throw error; // Rethrow the error to handle it in the UI
        }),
    enabled: isAuthenticated, // This query is not automatically run
  });

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  // if (loading) {
  //   return <div className="loading">Loading...</div>;
  // }

  const createMarketing = () => {
    axios
      .post("/marketing", {
        // Add your marketing creation logic here
      })
      .then((response) => {
        console.log("Marketing created:", response.data);
        // Optionally, redirect or show a success message
      });
  };

  const listMarketing = () => {
    axios
      .get("/marketing", {
        // Add your marketing creation logic here
      })
      .then((response) => {
        console.log("Marketing getted:", response.data);
        // Optionally, redirect or show a success message
      });
  };

  return (
    <div className="profile-page">
      <div className="profile-header-actions">
        <h1>Your Profile</h1>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
      <Profile user={profileQuery.data?.user} />
      <hr />
      <h2>Permissions</h2>
      {permissions.map((permission) => {
        return (
          <div key={permission} className="permission-item">
            <div>{permission}</div>
          </div>
        );
      })}
      <hr />
      <h2>Check Permissions</h2>
      <div className="permission-status-container">
        {permissionGrantedQuery.isLoading ? (
          <div className="permission-status-item">
            <span>Permission Granted:</span>
            <span className="loading-text">Loading...</span>
          </div>
        ) : (
          permissionGrantedQuery.data?.map((permission) => {
            return (
              <div
                key={`${permission.resource}-${permission.action}`}
                className="permission-status-item"
              >
                <span>
                  {permission.resource} - {permission.action}:
                </span>
                <span
                  className={
                    permission.granted ? "status-granted" : "status-denied"
                  }
                >
                  {permission.granted ? "Granted" : "Denied"}
                </span>
              </div>
            );
          })
        )}
        <hr />
      </div>
      <hr />
      <h2>Actions</h2>
      <div className="actions-container">
        <button onClick={listMarketing} className="action-button">
          List Marketing
        </button>
        <button onClick={createMarketing} className="action-button">
          Create Marketing
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
