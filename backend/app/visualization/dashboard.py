import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
import json
import os
from typing import Dict, Any
import numpy as np

class FederatedLearningDashboard:
    """Streamlit dashboard for visualizing federated learning results"""
    
    def __init__(self):
        self.setup_page_config()
    
    def setup_page_config(self):
        """Setup Streamlit page configuration"""
        st.set_page_config(
            page_title="Federated Learning Dashboard",
            page_icon="🤖",
            layout="wide",
            initial_sidebar_state="expanded"
        )
    
    def load_experiment_data(self, exp_path: str) -> Dict[str, Any]:
        """Load experiment data from directory"""
        data = {}
        
        # Load metrics
        metrics_path = os.path.join(exp_path, "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                data['metrics'] = json.load(f)
        
        # Load config
        config_path = os.path.join(exp_path, "config.json")
        if os.path.exists(config_path):
            with open(config_path, 'r') as f:
                data['config'] = json.load(f)
        
        return data
    
    def run_dashboard(self):
        """Run the main dashboard"""
        st.title("🤖 Federated Learning Dashboard")
        st.markdown("---")
        
        # Sidebar for experiment selection
        st.sidebar.title("Experiment Selection")
        
        # Experiment directory input
        exp_dir = st.sidebar.text_input("Experiment Directory", "./experiments")
        
        if not os.path.exists(exp_dir):
            st.sidebar.error(f"Directory {exp_dir} does not exist")
            return
        
        # List available experiments
        experiments = [d for d in os.listdir(exp_dir) 
                      if os.path.isdir(os.path.join(exp_dir, d)) and d.startswith("experiment_")]
        
        if not experiments:
            st.sidebar.warning("No experiments found")
            return
        
        selected_exp = st.sidebar.selectbox("Select Experiment", experiments)
        exp_path = os.path.join(exp_dir, selected_exp)
        
        # Load data
        data = self.load_experiment_data(exp_path)
        
        if not data:
            st.error("No data found for selected experiment")
            return
        
        # Display experiment info
        self.display_experiment_info(data)
        
        # Create tabs
        tab1, tab2, tab3, tab4 = st.tabs(["📊 Overview", "📈 Training Progress", "👥 Client Analysis", "⚙️ Configuration"])
        
        with tab1:
            self.display_overview(data)
        
        with tab2:
            self.display_training_progress(data)
        
        with tab3:
            self.display_client_analysis(data)
        
        with tab4:
            self.display_configuration(data)
    
    def display_experiment_info(self, data: Dict[str, Any]):
        """Display experiment information"""
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("Dataset", data.get('config', {}).get('dataset', 'Unknown'))
        
        with col2:
            st.metric("Number of Clients", data.get('config', {}).get('num_clients', 0))
        
        with col3:
            st.metric("Total Rounds", len(data.get('metrics', {}).get('round', [])))
        
        st.markdown("---")
    
    def display_overview(self, data: Dict[str, Any]):
        """Display overview metrics"""
        metrics = data.get('metrics', {})
        
        if not metrics:
            st.warning("No metrics data available")
            return
        
        # Calculate summary metrics
        final_accuracy = metrics.get('global_accuracy', [])[-1] if metrics.get('global_accuracy') else 0
        best_accuracy = max(metrics.get('global_accuracy', [0])) if metrics.get('global_accuracy') else 0
        final_loss = metrics.get('global_loss', [])[-1] if metrics.get('global_loss') else 0
        
        # Display key metrics
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("Final Accuracy", f"{final_accuracy:.2f}%")
        
        with col2:
            st.metric("Best Accuracy", f"{best_accuracy:.2f}%")
        
        with col3:
            st.metric("Final Loss", f"{final_loss:.4f}")
        
        with col4:
            total_comm_cost = sum(metrics.get('communication_costs', []))
            st.metric("Total Communication Cost", f"{total_comm_cost:.2f} MB")
        
        # Progress chart
        if metrics.get('round') and metrics.get('global_accuracy'):
            fig = go.Figure()
            
            fig.add_trace(go.Scatter(
                x=metrics['round'],
                y=metrics['global_accuracy'],
                mode='lines+markers',
                name='Global Accuracy',
                line=dict(color='blue', width=3)
            ))
            
            fig.update_layout(
                title="Training Progress",
                xaxis_title="Round",
                yaxis_title="Accuracy (%)",
                hovermode='x unified'
            )
            
            st.plotly_chart(fig, use_container_width=True)
    
    def display_training_progress(self, data: Dict[str, Any]):
        """Display detailed training progress"""
        metrics = data.get('metrics', {})
        
        if not metrics:
            st.warning("No metrics data available")
            return
        
        # Create subplots
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=("Global Accuracy", "Global Loss", "Communication Cost", "Accuracy vs Loss"),
            specs=[[{"secondary_y": False}, {"secondary_y": False}],
                   [{"secondary_y": False}, {"secondary_y": False}]]
        )
        
        # Global Accuracy
        if metrics.get('round') and metrics.get('global_accuracy'):
            fig.add_trace(
                go.Scatter(x=metrics['round'], y=metrics['global_accuracy'], 
                          name='Accuracy', line=dict(color='blue')),
                row=1, col=1
            )
        
        # Global Loss
        if metrics.get('round') and metrics.get('global_loss'):
            fig.add_trace(
                go.Scatter(x=metrics['round'], y=metrics['global_loss'], 
                          name='Loss', line=dict(color='red')),
                row=1, col=2
            )
        
        # Communication Cost
        if metrics.get('round') and metrics.get('communication_costs'):
            fig.add_trace(
                go.Scatter(x=metrics['round'], y=metrics['communication_costs'], 
                          name='Comm Cost', line=dict(color='green')),
                row=2, col=1
            )
        
        # Accuracy vs Loss scatter
        if metrics.get('global_accuracy') and metrics.get('global_loss'):
            fig.add_trace(
                go.Scatter(x=metrics['global_loss'], y=metrics['global_accuracy'], 
                          mode='markers', name='Acc vs Loss'),
                row=2, col=2
            )
        
        fig.update_layout(height=800, showlegend=False)
        st.plotly_chart(fig, use_container_width=True)
        
        # Training statistics
        st.subheader("Training Statistics")
        
        if metrics.get('global_accuracy'):
            col1, col2, col3 = st.columns(3)
            
            with col1:
                accuracy_std = np.std(metrics['global_accuracy'])
                st.metric("Accuracy Std Dev", f"{accuracy_std:.2f}%")
            
            with col2:
                convergence_round = self._find_convergence_round(metrics['global_accuracy'])
                st.metric("Convergence Round", convergence_round)
            
            with col3:
                avg_improvement = self._calculate_average_improvement(metrics['global_accuracy'])
                st.metric("Avg Improvement/Round", f"{avg_improvement:.3f}%")
    
    def display_client_analysis(self, data: Dict[str, Any]):
        """Display client-specific analysis"""
        metrics = data.get('metrics', {})
        
        if not metrics.get('client_accuracies'):
            st.warning("No client metrics data available")
            return
        
        client_accuracies = metrics['client_accuracies']
        client_losses = metrics.get('client_losses', [])
        rounds = metrics.get('round', [])
        
        # Client performance over time
        st.subheader("Client Performance Over Time")
        
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=("Client Accuracies", "Client Losses")
        )
        
        # Plot client accuracies
        num_clients = len(client_accuracies[0]) if client_accuracies else 0
        colors = px.colors.qualitative.Set3
        
        for client_idx in range(min(num_clients, 10)):  # Limit to 10 clients for visibility
            acc_history = [round_acc[client_idx] if client_idx < len(round_acc) else 0 
                          for round_acc in client_accuracies]
            
            fig.add_trace(
                go.Scatter(x=rounds, y=acc_history, 
                          name=f'Client {client_idx}', 
                          line=dict(color=colors[client_idx % len(colors)])),
                row=1, col=1
            )
        
        # Plot client losses
        if client_losses:
            for client_idx in range(min(num_clients, 10)):
                loss_history = [round_loss[client_idx] if client_idx < len(round_loss) else 0 
                               for round_loss in client_losses]
                
                fig.add_trace(
                    go.Scatter(x=rounds, y=loss_history, 
                              name=f'Client {client_idx}', 
                              line=dict(color=colors[client_idx % len(colors)]),
                              showlegend=False),
                    row=1, col=2
                )
        
        fig.update_layout(height=500)
        st.plotly_chart(fig, use_container_width=True)
        
        # Client statistics
        st.subheader("Client Statistics")
        
        if client_accuracies:
            # Calculate final client statistics
            final_client_accs = client_accuracies[-1] if client_accuracies else []
            
            if final_client_accs:
                client_stats = pd.DataFrame({
                    'Client': [f'Client {i}' for i in range(len(final_client_accs))],
                    'Final Accuracy': final_client_accs,
                    'Best Accuracy': [max([round_acc[i] for round_acc in client_accuracies if i < len(round_acc)]) 
                                    for i in range(len(final_client_accs))]
                })
                
                st.dataframe(client_stats, use_container_width=True)
                
                # Client distribution
                fig = px.box(client_stats, y='Final Accuracy', title="Client Accuracy Distribution")
                st.plotly_chart(fig, use_container_width=True)
    
    def display_configuration(self, data: Dict[str, Any]):
        """Display experiment configuration"""
        config = data.get('config', {})
        
        if not config:
            st.warning("No configuration data available")
            return
        
        st.subheader("Experiment Configuration")
        
        # Display configuration in a formatted way
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("**Dataset Configuration**")
            st.json({
                "Dataset": config.get('dataset', 'Unknown'),
                "Number of Clients": config.get('num_clients', 0),
                "Client Fraction": config.get('client_fraction', 1.0),
                "Alpha (Non-IID)": config.get('alpha', 0.5)
            })
        
        with col2:
            st.markdown("**Training Configuration**")
            st.json({
                "Number of Rounds": config.get('num_rounds', 0),
                "Local Epochs": config.get('local_epochs', 5),
                "Aggregation Strategy": config.get('aggregation_strategy', 'fedavg'),
                "Seed": config.get('seed', 42)
            })
        
        # Full configuration
        st.subheader("Full Configuration")
        st.json(config)
    
    def _find_convergence_round(self, accuracies: list, threshold: float = 0.1, window: int = 5) -> int:
        """Find the round where training converged"""
        if len(accuracies) < window:
            return len(accuracies)
        
        for i in range(window, len(accuracies)):
            recent_accs = accuracies[i-window:i]
            if np.std(recent_accs) < threshold:
                return i
        
        return len(accuracies)
    
    def _calculate_average_improvement(self, accuracies: list) -> float:
        """Calculate average improvement per round"""
        if len(accuracies) < 2:
            return 0.0
        
        improvements = [accuracies[i] - accuracies[i-1] for i in range(1, len(accuracies))]
        return np.mean(improvements)

def main():
    """Main function to run the dashboard"""
    dashboard = FederatedLearningDashboard()
    dashboard.run_dashboard()

if __name__ == "__main__":
    main()
