# FABRIVRA complete-cell benchmark v1

All costs, times, machine dimensions and material properties are synthetic original software-test inputs, not OEM/grade data or scientific validation. The OBJ is an original 80 x 50 x 20 mm consumer tray. It is a mesh, not a parametric production mould.

Fast path: in System Simulation, click Load 2 vs 4 cavity benchmark, then Run & compare scenarios. This creates a separate project with geometry, two resource records and two saved scenarios; existing projects are retained.

Manual import: create a project, import consumer-tray.obj in mm, import machines.csv and materials.csv through the respective library validate/import flow, import each scenario JSON, select the newly imported press and material, review, approve and run. Both alternatives produce 160 parts (80 x 2 vs 40 x 4 shots). Compare the same finite campaign, including startup and drain.

The baseline has four conveyor slots and 12 parts/container with a 25-second change. Change the container capacity or change time and rerun: downstream queueing changes actual robot/press waiting. Try 1000 conveyor slots, 0 seconds change and 0.01 seconds/part handling for the fast downstream counterexample. No optimum is hardcoded. The press hourly rate belongs to the machine record. Missing prices remain unknown. A run snapshot retains its original inputs and sources.

L0 provides mass balances and configured resource reservations. Pressure, temperature, moisture, collision clearance and product quality are unavailable/unverified; no FEM/FVM, CAE or forecasting model runs. Do not use the benchmark to size real production equipment.

License: original FABRIVRA code and fixtures MIT. No OEM assets or external material datasets are redistributed.
