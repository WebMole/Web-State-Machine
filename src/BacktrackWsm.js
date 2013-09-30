/**
 * Dummy instantiation of a {@link WebStateMachine}, where each
 * implemented method is kept as simple as possible. The BacktrackWsm
 * overrides the {@link processReset} method of the {@link VanillaWsm} to
 * jump to the <em>last</em> state since reset.
 * @constructor
 * @extends VanillaWsm
 */
function BacktrackWsm() // extends WebStateMachine
{
  // Used to extend the prototype of WSM
  this.VanillaWsm = VanillaWsm;
  this.VanillaWsm();
  
  /**
   * Handles the situation where the WSM has reached a dead end and is
   * sent back to its initial state. See {@link WebStateMachine#processReset}
   * for detailed info.
   * <p>
   * In the case of the BacktrackWsm, we simply jump to the next-to-last
   * node ID we visited.
   * @return {boolean} <tt>true</tt> if the exploration must continue,
   *   <tt>false</tt> if there is no unvisited page
   */
  this.processReset = function()
  {
    // Pop last state in the state stack and peek next-to-last
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Not supposed to happen, but anyway, means we are done
      return false;
    }
    var dummy = this.m_pathSinceBeginning.popLastElement();
    if (this.m_pathSinceBeginning.getLength() === 0)
    {
      // Finished backtracking: we are done
      return false;
    }
    var last_edge = this.m_pathSinceBeginning.peekLastElement();
    var new_edge = new WsmEdge();
    new_edge.setDestination(last_edge.getDestination());
    var ps = new PathSequence();
    ps.append(new_edge);
    this.m_pathToFollow = ps;
    return true;
  };
  
}
